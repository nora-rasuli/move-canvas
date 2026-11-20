import { describe, expect, it } from "vitest";

import { buildPerformanceScore, percentage, scoreExplanation } from "./performance-score";

describe("transparent session scoring", () => {
  it("applies the published component weights", () => {
    expect(
      buildPerformanceScore({
        movementMatch: 80,
        timingOrSequence: 60,
        completion: 100,
        trackingConfidence: 90,
      }),
    ).toEqual({
      version: "session-score-1.0",
      total: 82,
      components: {
        movementMatch: 80,
        timingOrSequence: 60,
        completion: 100,
        trackingConfidence: 90,
      },
    });
  });

  it("clamps invalid inputs to the public 0–100 range", () => {
    expect(
      buildPerformanceScore({
        movementMatch: 120,
        timingOrSequence: -4,
        completion: Number.NaN,
        trackingConfidence: 50.4,
      }).components,
    ).toEqual({
      movementMatch: 100,
      timingOrSequence: 0,
      completion: 0,
      trackingConfidence: 50,
    });
    expect(percentage(1.4)).toBe(100);
  });

  it("describes different Dance and Tennis component meanings", () => {
    expect(scoreExplanation("dance-coach")).toContain("timing 25%");
    expect(scoreExplanation("tennis-coach")).toContain("phase order 25%");
  });
});
