import { describe, expect, it } from "vitest";
import { createFallbackBlueprint, gameBlueprintSchema } from "./blueprint";

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
});
