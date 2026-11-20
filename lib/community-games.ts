import { z } from "zod";
import { storedBlueprintRecordSchema, type StoredBlueprintRecord } from "./blueprint";
import { getBrowserSupabaseClient } from "./channel";

const publishedGameRowSchema = z
  .object({
    id: z.string().uuid(),
    owner_id: z.string().uuid(),
    record: storedBlueprintRecordSchema,
    title: z.string().trim().min(3).max(48),
    description: z.string().trim().min(10).max(120),
    world: z.string().trim().min(2).max(40),
    likes_count: z.number().int().nonnegative(),
    created_at: z.string().min(1),
  })
  .strict();

export type PublishedGame = z.infer<typeof publishedGameRowSchema> & { likedByMe: boolean };

export async function publishGame(record: StoredBlueprintRecord): Promise<PublishedGame> {
  const client = await getBrowserSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Sign-in could not be created.");
  const blueprint = record.blueprint;
  const { data, error } = await client
    .from("published_games")
    .insert({
      owner_id: userData.user.id,
      record,
      title: blueprint.title,
      description: blueprint.oneLine,
      world: blueprint.theme.world,
    })
    .select("id,owner_id,record,title,description,world,likes_count,created_at")
    .single();
  if (error) throw error;
  return { ...publishedGameRowSchema.parse(data), likedByMe: false };
}

export async function listPublishedGames(): Promise<PublishedGame[]> {
  const client = await getBrowserSupabaseClient();
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user.id;
  const [{ data, error }, likedResult] = await Promise.all([
    client
      .from("published_games")
      .select("id,owner_id,record,title,description,world,likes_count,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    userId
      ? client.from("game_likes").select("game_id").eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (error) throw error;
  if (likedResult.error) throw likedResult.error;
  const likedIds = new Set((likedResult.data ?? []).map((row) => String(row.game_id)));
  return z
    .array(publishedGameRowSchema)
    .parse(data ?? [])
    .map((game) => ({
      ...game,
      likedByMe: likedIds.has(game.id),
    }));
}

export async function setGameLiked(gameId: string, liked: boolean) {
  const client = await getBrowserSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Sign-in could not be created.");
  const query = liked
    ? client.from("game_likes").insert({ game_id: gameId, user_id: userData.user.id })
    : client.from("game_likes").delete().eq("game_id", gameId).eq("user_id", userData.user.id);
  const { error } = await query;
  if (error && error.code !== "23505") throw error;
}

export async function addGameToSpace(gameId: string) {
  const client = await getBrowserSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Sign-in could not be created.");
  const { error } = await client
    .from("user_game_library")
    .upsert(
      { game_id: gameId, user_id: userData.user.id },
      { onConflict: "user_id,game_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}
