-- Move Canvas uses short-lived, high-entropy room topics and anonymous Auth
-- sessions. Possession of the 12-character room code grants access to that
-- ephemeral room; camera frames never enter Realtime.

drop policy if exists "move_canvas_rooms_can_receive_broadcasts" on realtime.messages;
drop policy if exists "move_canvas_rooms_can_send_broadcasts" on realtime.messages;

create policy "move_canvas_rooms_can_receive_broadcasts"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) ~ '^move-canvas:[0-9A-Z]{12}$'
);

create policy "move_canvas_rooms_can_send_broadcasts"
on realtime.messages
for insert
to authenticated
with check (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) ~ '^move-canvas:[0-9A-Z]{12}$'
);
