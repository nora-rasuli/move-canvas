-- Public game publishing, per-user likes, and My Space membership.
-- Anonymous Supabase Auth users receive the authenticated role and a stable
-- browser identity. RLS scopes every write to that identity.

create table if not exists public.published_games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  record jsonb not null,
  title text not null check (char_length(title) between 3 and 48),
  description text not null check (char_length(description) between 10 and 120),
  world text not null check (char_length(world) between 2 and 40),
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.game_likes (
  game_id uuid not null references public.published_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create table if not exists public.user_game_library (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.published_games(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists published_games_created_at_idx
  on public.published_games (created_at desc);
create index if not exists game_likes_user_id_idx on public.game_likes (user_id);
create index if not exists user_game_library_user_id_idx on public.user_game_library (user_id);

alter table public.published_games enable row level security;
alter table public.game_likes enable row level security;
alter table public.user_game_library enable row level security;

grant select on public.published_games to anon, authenticated;
grant insert, delete on public.published_games to authenticated;
grant select, insert, delete on public.game_likes to authenticated;
grant select, insert, delete on public.user_game_library to authenticated;

drop policy if exists "Published games are publicly readable" on public.published_games;
create policy "Published games are publicly readable"
on public.published_games for select to anon, authenticated using (true);

drop policy if exists "Players publish their own games" on public.published_games;
create policy "Players publish their own games"
on public.published_games for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

drop policy if exists "Players remove their own games" on public.published_games;
create policy "Players remove their own games"
on public.published_games for delete to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Players read their own likes" on public.game_likes;
create policy "Players read their own likes"
on public.game_likes for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players create their own likes" on public.game_likes;
create policy "Players create their own likes"
on public.game_likes for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Players remove their own likes" on public.game_likes;
create policy "Players remove their own likes"
on public.game_likes for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players read their own space" on public.user_game_library;
create policy "Players read their own space"
on public.user_game_library for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players add to their own space" on public.user_game_library;
create policy "Players add to their own space"
on public.user_game_library for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Players remove from their own space" on public.user_game_library;
create policy "Players remove from their own space"
on public.user_game_library for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.update_game_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.published_games set likes_count = likes_count + 1 where id = new.game_id;
    return new;
  end if;
  update public.published_games set likes_count = greatest(0, likes_count - 1) where id = old.game_id;
  return old;
end;
$$;

drop trigger if exists sync_game_like_count on public.game_likes;
create trigger sync_game_like_count
after insert or delete on public.game_likes
for each row execute function public.update_game_like_count();

create or replace function public.limit_game_publish_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.published_games
    where owner_id = new.owner_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Publish limit reached. Try again later.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists limit_game_publish_rate on public.published_games;
create trigger limit_game_publish_rate
before insert on public.published_games
for each row execute function public.limit_game_publish_rate();
