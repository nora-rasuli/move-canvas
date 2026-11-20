import { describe, expect, it } from "vitest";
import type { Landmark } from "./pose";
import { classifyPose, hasTrackableBody, type CalibrationProfile } from "./pose";

function frame(overrides: Partial<Record<number, Partial<Landmark>>> = {}) {
  return Array.from({ length: 33 }, (_, index) => ({
    x: overrides[index]?.x ?? 0.5,
    y: overrides[index]?.y ?? 0.5,
    visibility: overrides[index]?.visibility ?? 1,
  }));
}

const left = frame({ 11: { x: 0.4 }, 15: { x: 0.1 } });
const right = frame({ 12: { x: 0.6 }, 16: { x: 0.9 } });
const duck = frame({ 11: { y: 0.72 }, 12: { y: 0.72 } });
const neutral = frame({ 11: { y: 0.35 }, 12: { y: 0.35 } });
const profile: CalibrationProfile = {
  version: "1.0",
  capturedAt: "2026-11-19T00:00:00.000Z",
  samples: {
    reach_left: { capturedAt: 1, landmarks: left },
    reach_right: { capturedAt: 2, landmarks: right },
    duck: { capturedAt: 3, landmarks: duck },
    freeze: { capturedAt: 4, landmarks: neutral },
  },
};

describe("pose classifier", () => {
  it("requires visible upper-body landmarks", () => {
    expect(hasTrackableBody(frame({ 15: { visibility: 0.2 } }))).toBe(false);
  });

  it("recognizes calibrated reach and duck poses", () => {
    expect(classifyPose(left, profile)).toBe("reach_left");
    expect(classifyPose(right, profile)).toBe("reach_right");
    expect(classifyPose(duck, profile)).toBe("duck");
  });

  it("returns neutral freeze inside the calibrated movement thresholds", () => {
    expect(classifyPose(neutral, profile)).toBe("freeze");
  });
});
