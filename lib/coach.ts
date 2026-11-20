import { z } from "zod";

export const experienceModeSchema = z.enum(["motion-game", "dance-coach", "tennis-coach"]);
export type ExperienceMode = z.infer<typeof experienceModeSchema>;

export const confidenceSchema = z.number().min(0).max(1);
export type Confidence = z.infer<typeof confidenceSchema>;

export const normalizedPointSchema = z.tuple([
  z.number().min(-8).max(8),
  z.number().min(-8).max(8),
  confidenceSchema,
]);
export type NormalizedPoint = z.infer<typeof normalizedPointSchema>;

export const normalizedReferenceFrameSchema = z.object({
  t: z.number().int().min(0).max(90_000),
  c: confidenceSchema,
  p: z.array(normalizedPointSchema).length(12),
});
export type NormalizedReferenceFrame = z.infer<typeof normalizedReferenceFrameSchema>;

export const danceTimelineSchema = z.object({
  version: z.literal("1.1"),
  durationMs: z.number().int().min(10_000).max(90_000),
  sampleHz: z.number().positive().max(10),
  orientation: z.enum(["lead-left", "lead-right", "mirror"]),
  frames: z.array(normalizedReferenceFrameSchema).max(900),
});
export type DanceTimeline = z.infer<typeof danceTimelineSchema>;

export const tennisDrillSchema = z.enum(["shadow-serve", "shadow-forehand"]);
export type TennisDrill = z.infer<typeof tennisDrillSchema>;
export const handednessSchema = z.enum(["left", "right"]);
export type Handedness = z.infer<typeof handednessSchema>;

export const coachSessionSchema = z.object({
  id: z.string().min(8).max(80),
  roomCode: z.string().regex(/^[0-9A-Z]{12}$/),
  mode: z.enum(["dance-coach", "tennis-coach"]),
  createdAt: z.string(),
  status: z.enum(["setup", "ready", "running", "paused", "finished"]),
  clipLabel: z.string().max(120).optional(),
  drill: tennisDrillSchema.optional(),
  handedness: handednessSchema.optional(),
});
export type CoachSession = z.infer<typeof coachSessionSchema>;

export type DanceTiming = "on-time" | "early" | "late" | "form-mismatch" | "low-confidence";
export type BodyRegion = "arms" | "torso" | "legs";

export type DanceFeedbackEvent = {
  timing: DanceTiming;
  region: BodyRegion | null;
  offsetMs: number | null;
  confidence: number;
  cue: string;
};

export const danceFeedbackEventSchema = z
  .object({
    timing: z.enum(["on-time", "early", "late", "form-mismatch", "low-confidence"]),
    region: z.enum(["arms", "torso", "legs"]).nullable(),
    offsetMs: z.number().finite().min(-90_000).max(90_000).nullable(),
    confidence: confidenceSchema,
    cue: z.string().trim().min(1).max(180),
  })
  .strict();

export type TennisPhase =
  | "ready"
  | "trophy"
  | "reach-proxy"
  | "follow-through"
  | "unit-turn"
  | "load"
  | "contact-zone-proxy"
  | "finish";

export type FeedbackCue = {
  code: string;
  text: string;
  confidence: number;
};

export type CoachResult = {
  mode: "dance-coach" | "tennis-coach";
  completedAt: string;
  confidence: number;
  completedUnits: number;
  cues: FeedbackCue[];
  limitation: string;
};

export const tennisPhaseSchema = z.enum([
  "ready",
  "trophy",
  "reach-proxy",
  "follow-through",
  "unit-turn",
  "load",
  "contact-zone-proxy",
  "finish",
]);

export const coachResultSchema = z
  .object({
    mode: z.enum(["dance-coach", "tennis-coach"]),
    completedAt: z.string().min(1).max(80),
    confidence: confidenceSchema,
    completedUnits: z.number().int().min(0).max(10_000),
    cues: z
      .array(
        z
          .object({
            code: z.string().trim().min(1).max(80),
            text: z.string().trim().min(1).max(240),
            confidence: confidenceSchema,
          })
          .strict(),
      )
      .max(2),
    limitation: z.string().trim().min(1).max(360),
  })
  .strict();

export const DANCE_LIMITATION =
  "Practice feedback compares estimated 2D pose and timing with this reference under the current camera view; it does not grade artistry or provide professional instruction.";

export const TENNIS_LIMITATION =
  "Practice feedback recognizes coarse 2D shadow-movement phases only; it cannot evaluate a ball, racket, force, speed, spin, placement, or biomechanics.";

export function serializedBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
