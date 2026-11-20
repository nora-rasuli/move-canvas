import type { DanceFeedbackEvent, DanceTimeline, TennisDrill, TennisPhase } from "./coach";

export function createVerificationDanceTimeline(): DanceTimeline {
  const base = [
    [-0.5, -1.5, 0.95], [0.5, -1.5, 0.95], [-0.8, -0.7, 0.95], [0.8, -0.7, 0.95],
    [-1, 0, 0.95], [1, 0, 0.95], [-0.3, 0, 0.95], [0.3, 0, 0.95],
    [-0.35, 1.2, 0.95], [0.35, 1.2, 0.95], [-0.4, 2.4, 0.95], [0.4, 2.4, 0.95],
  ] as DanceTimeline["frames"][number]["p"];
  return {
    version: "1.1",
    durationMs: 10_000,
    sampleHz: 10,
    orientation: "lead-left",
    frames: Array.from({ length: 101 }, (_, index) => ({
      t: index * 100,
      c: 0.95,
      p: base.map(([x, y, confidence], joint) => [x + (joint < 6 ? Math.sin(index / 8) * 0.2 : 0), y, confidence]),
    })),
  };
}

export const verificationDanceEvents: DanceFeedbackEvent[] = [
  { timing: "early", region: null, offsetMs: 320, confidence: 0.9, cue: "Hold this shape a moment longer before the next change." },
  { timing: "early", region: null, offsetMs: 300, confidence: 0.9, cue: "Hold this shape a moment longer before the next change." },
  { timing: "form-mismatch", region: "arms", offsetMs: 20, confidence: 0.84, cue: "Check the arm shape against the reference before continuing." },
];

export const verificationTennisPhases = (drill: TennisDrill): TennisPhase[] => drill === "shadow-serve"
  ? ["ready", "trophy", "reach-proxy", "follow-through"]
  : ["ready", "unit-turn", "load", "contact-zone-proxy", "finish"];
