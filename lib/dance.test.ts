import { describe, expect, it } from "vitest";
import type { Landmark, PoseFrame } from "./pose";
import { buildDanceTimeline, compareDancePose, DANCE_MAX_PAYLOAD_BYTES, normalizeDancePose, summarizeDanceEvents } from "./dance";
import { serializedBytes } from "./coach";

const pose = (shift = 0, armLift = 0, visibility = 0.95): Landmark[] => {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility }));
  const values: Record<number, [number, number]> = {
    11: [0.42, 0.3], 12: [0.58, 0.3], 13: [0.36, 0.42], 14: [0.64, 0.42],
    15: [0.3 + shift, 0.52 - armLift], 16: [0.7 + shift, 0.52 - armLift],
    23: [0.45, 0.55], 24: [0.55, 0.55], 25: [0.44, 0.74], 26: [0.56, 0.74],
    27: [0.43, 0.94], 28: [0.57, 0.94],
  };
  for (const [index, [x, y]] of Object.entries(values)) landmarks[Number(index)] = { x, y, visibility };
  return landmarks;
};

const frames = (durationMs = 10_000): PoseFrame[] => Array.from({ length: durationMs / 100 + 1 }, (_, index) => ({
  capturedAt: index * 100,
  landmarks: pose(index < 25 ? 0 : index < 60 ? 0.08 : -0.06, index < 25 ? 0 : index < 60 ? 0.12 : 0.22),
}));

describe("dance reference normalization and comparison", () => {
  it("normalizes scale and rejects low-confidence bodies", () => {
    expect(normalizeDancePose(pose())?.p).toHaveLength(12);
    expect(normalizeDancePose(pose(0, 0, 0.2))).toBeNull();
  });

  it("samples no faster than 10 Hz and keeps a 90 second timeline below 1 MiB", () => {
    const timeline = buildDanceTimeline(frames(90_000), 90_000);
    expect(timeline.frames).toHaveLength(900);
    expect(serializedBytes(timeline)).toBeLessThanOrEqual(DANCE_MAX_PAYLOAD_BYTES);
  });

  it("detects seeded early, late, and arm mismatch states", () => {
    const timeline = buildDanceTimeline(frames(), 10_000);
    const early = compareDancePose(timeline, pose(0.08, 0.12), 1_500);
    const late = compareDancePose(timeline, pose(), 3_200);
    const mismatch = compareDancePose(timeline, pose(0.9, -0.7), 5_000);
    expect(early.timing).toBe("early");
    expect(early.offsetMs).toBeGreaterThanOrEqual(250);
    expect(late.timing).toBe("late");
    expect(late.offsetMs).toBeLessThanOrEqual(-250);
    expect(mismatch.timing).toBe("form-mismatch");
    expect(mismatch.region).toBe("arms");
  });

  it("limits result guidance to two reference-relative cues", () => {
    const result = summarizeDanceEvents([
      { timing: "early", region: null, offsetMs: 300, confidence: 0.9, cue: "early" },
      { timing: "early", region: null, offsetMs: 350, confidence: 0.9, cue: "early" },
      { timing: "late", region: null, offsetMs: -300, confidence: 0.8, cue: "late" },
      { timing: "form-mismatch", region: "arms", offsetMs: 0, confidence: 0.85, cue: "arms" },
    ]);
    expect(result.cues).toHaveLength(2);
    expect(result.limitation).toContain("estimated 2D pose");
  });
});
