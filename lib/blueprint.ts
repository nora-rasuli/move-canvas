import { z } from "zod";

export const gestureSchema = z.enum(["reach_left", "reach_right", "duck", "freeze"]);

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

export const blueprintProvenanceSchema = z
  .object({
    generator: z.enum(["ai", "deterministic-fallback"]),
    model: z.string().max(120).nullable(),
    generatedAt: z.string().min(1).max(80),
    sourcePrompt: z.string().trim().min(12).max(280),
    validation: z.literal("passed"),
    degradedReason: z.enum(["provider-not-configured", "provider-unavailable"]).optional(),
  })
  .strict();

export type BlueprintResponse = {
  blueprint: GameBlueprint;
  provenance: BlueprintProvenance;
};

export const blueprintResponseSchema = z
  .object({
    blueprint: gameBlueprintSchema,
    provenance: blueprintProvenanceSchema,
  })
  .strict();

export const blueprintEditSchema = z
  .object({
    field: z.enum(["title", "oneLine", "durationSeconds", "intensity", "gestures"]),
    previous: z.string().max(320),
    next: z.string().max(320),
    editedAt: z.string().min(1).max(80),
  })
  .strict();

export type BlueprintEdit = z.infer<typeof blueprintEditSchema>;

export const storedBlueprintRecordSchema = z
  .object({
    version: z.literal("1.1"),
    blueprint: gameBlueprintSchema,
    provenance: blueprintProvenanceSchema,
    edits: z.array(blueprintEditSchema).max(12),
    acceptedAt: z.string().min(1).max(80),
  })
  .strict();

export type StoredBlueprintRecord = z.infer<typeof storedBlueprintRecordSchema>;

export function parseStoredBlueprint(raw: string | null): GameBlueprint | null {
  if (!raw) return null;
  try {
    return gameBlueprintSchema.safeParse(JSON.parse(raw)).data ?? null;
  } catch {
    return null;
  }
}

export function parseStoredBlueprintRecord(raw: string | null): StoredBlueprintRecord | null {
  if (!raw) return null;
  try {
    return storedBlueprintRecordSchema.safeParse(JSON.parse(raw)).data ?? null;
  } catch {
    return null;
  }
}

const meaningfulWords = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 3 &&
        !/^(where|with|from|into|before|after|through|around|that|this|game)$/i.test(token),
    );

const titleCase = (value: string) => value[0].toUpperCase() + value.slice(1).toLowerCase();

const promptHash = (value: string) =>
  [...value.toLowerCase()].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );

export function createFallbackBlueprint(prompt: string): GameBlueprint {
  const words = meaningfulWords(prompt);
  const subject = titleCase(words.at(-1) ?? "Comet");
  const hash = promptHash(prompt);
  const isOcean = /ocean|fish|reef|coral|pirate|wave|underwater|jellyfish/i.test(prompt);
  const isForest = /forest|garden|firefl|pumpkin|animal|fox|tree|nature|flower/i.test(prompt);
  const isCity = /city|street|rooftop|subway|traffic|neon/i.test(prompt);
  const isSnow = /snow|ice|winter|arctic|penguin/i.test(prompt);
  const isDesert = /desert|cactus|sand|camel|oasis/i.test(prompt);

  const theme = isOcean
    ? {
        world: "Moonlit reef",
        player: "current rider",
        collectible: /treasure|pearl/i.test(prompt) ? "pearls" : "coral lights",
        hazard: /jellyfish/i.test(prompt) ? "jellyfish" : "riptides",
        palette: ["#071A2B", "#25D0AB", "#FFCE65"] as const,
      }
    : isForest
      ? {
          world: /garden|pumpkin/i.test(prompt) ? "Moonlit garden" : "Electric forest",
          player: /garden|pumpkin/i.test(prompt) ? "garden runner" : "trail keeper",
          collectible: /firefl/i.test(prompt) ? "fireflies" : "glow seeds",
          hazard: /pumpkin/i.test(prompt) ? "rolling pumpkins" : "storm clouds",
          palette: ["#10261F", "#C9F45B", "#F86B4F"] as const,
        }
      : isCity
        ? {
            world: "Neon city",
            player: "night courier",
            collectible: "signal sparks",
            hazard: "traffic pulses",
            palette: ["#111126", "#56D6FF", "#FF5C9A"] as const,
          }
        : isSnow
          ? {
              world: "Aurora icefield",
              player: "glacier scout",
              collectible: "aurora shards",
              hazard: "snow gusts",
              palette: ["#09233A", "#A9F0FF", "#F7D06A"] as const,
            }
          : isDesert
            ? {
                world: "Sunset dunes",
                player: "oasis runner",
                collectible: "water gems",
                hazard: "sand spirals",
                palette: ["#311B18", "#FFBF69", "#70D6C8"] as const,
              }
            : {
                world: `${subject} orbit`,
                player: "star courier",
                collectible: "star parcels",
                hazard: "meteors",
                palette: ["#120D2E", "#7CFFCB", "#FF6B8A"] as const,
              };

  const intensity = /gentle|slow|calm|easy/i.test(prompt)
    ? "gentle"
    : /fast|quick|race|rush|storm|dodge/i.test(prompt)
      ? "lively"
      : hash % 2
        ? "gentle"
        : "lively";
  const durationSeconds = /quick|short|sprint/i.test(prompt)
    ? 30
    : /long|endurance|journey/i.test(prompt)
      ? 90
      : intensity === "gentle"
        ? 90
        : 60;
  const gestureCandidates: Gesture[] = [];
  if (/left|collect|catch|reach|grab|firefl|pearl|treasure/i.test(prompt))
    gestureCandidates.push("reach_left", "reach_right");
  if (/duck|dodge|avoid|under|rolling|storm|meteor|jellyfish/i.test(prompt))
    gestureCandidates.push("duck");
  if (/freeze|stop|signal|statue|hide/i.test(prompt)) gestureCandidates.push("freeze");
  const rotation: Gesture[] = ["reach_left", "reach_right", "duck", "freeze"];
  for (let offset = 0; gestureCandidates.length < (intensity === "lively" ? 4 : 3); offset += 1)
    gestureCandidates.push(rotation[(hash + offset) % rotation.length]);
  const gestures = [...new Set(gestureCandidates)].slice(0, intensity === "lively" ? 4 : 3);
  while (gestures.length < 2) gestures.push(rotation[(hash + gestures.length) % rotation.length]);
  const hazardRatio = Number((0.18 + ((hash >>> 3) % 24) / 100).toFixed(2));
  const spawnEveryMs = intensity === "lively" ? 750 + (hash % 4) * 100 : 1250 + (hash % 4) * 150;
  const pointsPerCollectible = [5, 10, 15, 20][hash % 4];

  return gameBlueprintSchema.parse({
    schemaVersion: "1.0",
    title: `${subject} ${intensity === "lively" ? "Dash" : "Quest"}`,
    oneLine: `Collect ${theme.collectible} and dodge ${theme.hazard} before the route closes.`,
    theme,
    durationSeconds,
    intensity,
    gestures,
    spawnEveryMs,
    hazardRatio,
    pointsPerCollectible,
    instructions: [
      gestures.includes("reach_left")
        ? `Reach toward each side to catch ${theme.collectible}.`
        : `Hold your space while ${theme.collectible} approach.`,
      gestures.includes("duck")
        ? `Duck below ${theme.hazard}.`
        : `Freeze to let ${theme.hazard} pass.`,
      gestures.includes("freeze")
        ? "Freeze when the signal turns violet."
        : "Keep a steady rhythm between targets.",
    ],
  });
}
