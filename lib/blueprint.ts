import { z } from "zod";

export const gestureSchema = z.enum([
  "reach_left",
  "reach_right",
  "duck",
  "freeze",
]);

export type Gesture = z.infer<typeof gestureSchema>;

export const gameBlueprintSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    title: z.string().trim().min(3).max(48),
    oneLine: z.string().trim().min(10).max(120),
    theme: z.object({
      world: z.string().trim().min(2).max(40),
      player: z.string().trim().min(2).max(32),
      collectible: z.string().trim().min(2).max(24),
      hazard: z.string().trim().min(2).max(24),
      palette: z.tuple([
        z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      ]),
    }),
    durationSeconds: z.number().int().min(30).max(90),
    intensity: z.enum(["gentle", "lively"]),
    gestures: z.array(gestureSchema).min(2).max(4),
    spawnEveryMs: z.number().int().min(700).max(1800),
    hazardRatio: z.number().min(0.15).max(0.45),
    pointsPerCollectible: z.number().int().min(5).max(25),
    instructions: z.array(z.string().trim().min(6).max(90)).min(2).max(4),
  })
  .strict();

export type GameBlueprint = z.infer<typeof gameBlueprintSchema>;

export type BlueprintProvenance = {
  generator: "ai" | "deterministic-fallback";
  model: string | null;
  generatedAt: string;
  sourcePrompt: string;
  validation: "passed";
  degradedReason?: "provider-not-configured" | "provider-unavailable";
};

export type BlueprintResponse = {
  blueprint: GameBlueprint;
  provenance: BlueprintProvenance;
};

const word = (value: string, fallback: string) => {
  const clean = value
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3)
    .at(-1);
  return clean ? clean[0].toUpperCase() + clean.slice(1).toLowerCase() : fallback;
};

export function createFallbackBlueprint(prompt: string): GameBlueprint {
  const subject = word(prompt, "Comet");
  const isOcean = /ocean|fish|reef|pirate|wave/i.test(prompt);
  const isForest = /forest|animal|fox|tree|nature/i.test(prompt);

  const theme = isOcean
    ? { world: "Moonlit reef", player: "current rider", collectible: "pearls", hazard: "jellyfish", palette: ["#071A2B", "#25D0AB", "#FFCE65"] as const }
    : isForest
      ? { world: "Electric forest", player: "trail keeper", collectible: "fireflies", hazard: "storm clouds", palette: ["#10261F", "#C9F45B", "#F86B4F"] as const }
      : { world: `${subject} orbit`, player: "star courier", collectible: "star parcels", hazard: "meteors", palette: ["#120D2E", "#7CFFCB", "#FF6B8A"] as const };

  return gameBlueprintSchema.parse({
    schemaVersion: "1.0",
    title: `${subject} Dash`,
    oneLine: `Collect ${theme.collectible} and dodge ${theme.hazard} before the route closes.`,
    theme,
    durationSeconds: 60,
    intensity: "lively",
    gestures: ["reach_left", "reach_right", "duck", "freeze"],
    spawnEveryMs: 1100,
    hazardRatio: 0.3,
    pointsPerCollectible: 10,
    instructions: [
      `Reach left or right to catch ${theme.collectible}.`,
      `Duck below ${theme.hazard}.`,
      "Freeze when the signal turns violet.",
    ],
  });
}
