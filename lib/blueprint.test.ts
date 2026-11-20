import { describe, expect, it } from "vitest";
import {
  createFallbackBlueprint,
  gameBlueprintSchema,
  parseStoredBlueprint,
  parseStoredBlueprintRecord,
} from "./blueprint";

describe("GameBlueprint", () => {
  it("creates a safe, schema-valid blueprint from fresh text", () => {
    const result = createFallbackBlueprint("A moonlit ocean game with pearls");
    expect(gameBlueprintSchema.safeParse(result).success).toBe(true);
    expect(result.theme.collectible).toBe("pearls");
    expect(result.gestures).not.toContain("jump");
  });

  it("rejects gestures outside the verified palette", () => {
    const result = createFallbackBlueprint("A volcano sprint");
    expect(() => gameBlueprintSchema.parse({ ...result, gestures: ["backflip"] })).toThrow();
  });

  it("maps different prompt intent to different playable behavior", () => {
    const garden = createFallbackBlueprint(
      "A calm moonlit garden where I collect fireflies and avoid rolling pumpkins",
    );
    const reef = createFallbackBlueprint(
      "A quick coral reef treasure hunt where I dodge jellyfish and catch pearls",
    );
    expect(garden.theme.world).toBe("Moonlit garden");
    expect(garden.theme.collectible).toBe("fireflies");
    expect(garden.intensity).toBe("gentle");
    expect(reef.theme.world).toBe("Moonlit reef");
    expect(reef.intensity).toBe("lively");
    expect({
      duration: garden.durationSeconds,
      gestures: garden.gestures,
      cadence: garden.spawnEveryMs,
      hazards: garden.hazardRatio,
    }).not.toEqual({
      duration: reef.durationSeconds,
      gestures: reef.gestures,
      cadence: reef.spawnEveryMs,
      hazards: reef.hazardRatio,
    });
  });

  it("fails closed on malformed persisted blueprints and provenance records", () => {
    const blueprint = createFallbackBlueprint("A moonlit ocean game with pearls");
    expect(parseStoredBlueprint(JSON.stringify(blueprint))?.title).toBe(blueprint.title);
    expect(parseStoredBlueprint("{bad-json")).toBeNull();
    expect(
      parseStoredBlueprint(JSON.stringify({ ...blueprint, gestures: ["backflip"] })),
    ).toBeNull();
    expect(parseStoredBlueprintRecord(JSON.stringify({ version: "1.1", blueprint }))).toBeNull();
  });
});
