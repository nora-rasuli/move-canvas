import { z } from "zod";
import {
  gameBlueprintSchema,
  storedBlueprintRecordSchema,
  type StoredBlueprintRecord,
} from "./blueprint";
import { readBrowserStorage, writeBrowserStorage } from "./browser-storage";

export const SAVED_GAMES_KEY = "move-canvas:saved-games";

const savedGameSchema = z
  .object({
    id: z.string().uuid(),
    savedAt: z.string().min(1).max(80),
    record: storedBlueprintRecordSchema,
  })
  .strict();

const savedGamesSchema = z.array(savedGameSchema).max(20);

export type SavedGame = z.infer<typeof savedGameSchema>;

export function readSavedGames(): SavedGame[] {
  const raw = readBrowserStorage("local", SAVED_GAMES_KEY);
  if (!raw) return [];
  try {
    return savedGamesSchema.safeParse(JSON.parse(raw)).data ?? [];
  } catch {
    return [];
  }
}

export function saveGame(record: StoredBlueprintRecord) {
  const current = readSavedGames();
  const sameIdea = current.find(
    (entry) =>
      entry.record.provenance.sourcePrompt === record.provenance.sourcePrompt &&
      entry.record.blueprint.title === record.blueprint.title,
  );
  const entry: SavedGame = {
    id: sameIdea?.id ?? crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    record,
  };
  const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 20);
  return writeBrowserStorage("local", SAVED_GAMES_KEY, JSON.stringify(next)) ? entry : null;
}

export function removeSavedGame(id: string) {
  return writeBrowserStorage(
    "local",
    SAVED_GAMES_KEY,
    JSON.stringify(readSavedGames().filter((entry) => entry.id !== id)),
  );
}

export function activateSavedGame(game: SavedGame) {
  const blueprint = gameBlueprintSchema.parse(game.record.blueprint);
  return (
    writeBrowserStorage("local", "move-canvas:active-blueprint", JSON.stringify(blueprint)) &&
    writeBrowserStorage("local", "move-canvas:active-blueprint-record", JSON.stringify(game.record))
  );
}
