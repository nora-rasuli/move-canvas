import { describe, expect, it } from "vitest";
import {
  classifyTennisPhase,
  observeTennisPose,
  PHASES,
  summarizeTennisReps,
  TennisRepTracker,
  type TennisObservation,
  type TennisRep,
} from "./tennis";

const observation = (values: Partial<TennisObservation> = {}): TennisObservation => ({
  confidence: 0.9,
  wristHeight: 0,
  wristAcrossBody: 0,
  wristBehindBody: 0,
  shoulderTurn: 0,
  kneeLoad: 1,
  ...values,
});

const serve = [
  observation(),
  observation({ wristHeight: 0.8, wristBehindBody: 0.4 }),
  observation({ wristHeight: 1.7 }),
  observation({ wristAcrossBody: 1, wristHeight: 0.1 }),
];

const forehand = [
  observation(),
  observation({ shoulderTurn: 0.35 }),
  observation({ wristBehindBody: 0.7, kneeLoad: 1.8 }),
  observation({ wristBehindBody: -0.8 }),
  observation({ wristAcrossBody: 1, wristHeight: 0.4 }),
];

const backhand = [
  observation(),
  observation({ shoulderTurn: 0.35 }),
  observation({ wristBehindBody: -0.7, kneeLoad: 1.8 }),
  observation({ wristBehindBody: 0.8 }),
  observation({ wristAcrossBody: -1, wristHeight: 0.4 }),
];

const volley = [
  observation(),
  observation({ shoulderTurn: 0.35 }),
  observation({ wristBehindBody: 0.55 }),
  observation({ wristAcrossBody: 0.8, wristHeight: 0.1 }),
];

describe("deterministic shadow tennis analysis", () => {
  it("keeps seated upper-body observations usable when a knee is obscured", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 1,
    }));
    landmarks[11].x = 0.4;
    landmarks[12].x = 0.6;
    landmarks[16].x = 0.8;
    landmarks[26].visibility = 0.1;

    expect(observeTennisPose(landmarks, "right")).toMatchObject({
      kneeLoad: null,
      confidence: 1,
    });
  });

  it("uses shoulder turn as the seated load proxy", () => {
    expect(
      classifyTennisPhase(
        observation({ kneeLoad: null, shoulderTurn: 0.3, wristBehindBody: 0.7 }),
        "shadow-forehand",
      ),
    ).toBe("load");
  });

  it("classifies every supported ordered phase", () => {
    expect(serve.map((entry) => classifyTennisPhase(entry, "shadow-serve"))).toEqual(
      PHASES["shadow-serve"],
    );
    expect(forehand.map((entry) => classifyTennisPhase(entry, "shadow-forehand"))).toEqual(
      PHASES["shadow-forehand"],
    );
    expect(backhand.map((entry) => classifyTennisPhase(entry, "shadow-backhand"))).toEqual(
      PHASES["shadow-backhand"],
    );
    expect(volley.map((entry) => classifyTennisPhase(entry, "shadow-volley"))).toEqual(
      PHASES["shadow-volley"],
    );
  });

  it("rejects low-confidence and out-of-order traces", () => {
    const tracker = new TennisRepTracker("shadow-serve");
    expect(classifyTennisPhase(observation({ confidence: 0.3 }), "shadow-serve")).toBeNull();
    expect(tracker.ingest("reach-proxy", serve[2])).toBeNull();
    expect(tracker.ingest("ready", serve[0])).toBeNull();
    expect(tracker.ingest("follow-through", serve[3])).toBeNull();
  });

  it("qualifies a rep only after its full ordered sequence", () => {
    const tracker = new TennisRepTracker("shadow-forehand");
    let rep: TennisRep | null = null;
    for (const entry of forehand)
      rep = tracker.ingest(classifyTennisPhase(entry, "shadow-forehand"), entry) ?? rep;
    expect(rep?.phases).toEqual(PHASES["shadow-forehand"]);
  });

  it("emits at most two issues repeated in two of three reps", () => {
    const reps = [0, 1, 2].map(() => ({
      drill: "shadow-serve" as const,
      phases: PHASES["shadow-serve"],
      confidence: 0.85,
      issues: ["serve-trophy-height", "serve-reach-range"],
    }));
    const result = summarizeTennisReps(reps);
    expect(result.cues).toHaveLength(2);
    expect(result.completedUnits).toBe(3);
    expect(result.limitation).toContain("coarse 2D shadow-movement phases");
  });
});
