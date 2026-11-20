import { describe, expect, it } from "vitest";
import {
  calibrationStorageKey,
  calibrationThresholds,
  captureCalibrationSample,
  createCalibrationRecord,
  parseCalibrationRecord,
  type CalibrationSample,
} from "./calibration";
import { classifyTennisPhase, type TennisObservation } from "./tennis";

const sample = (values: Partial<CalibrationSample> = {}): CalibrationSample => ({
  armReach: 0.2,
  kneeLoad: 1.2,
  shoulderTurn: 0.05,
  poseSpread: 1.2,
  confidence: 0.95,
  ...values,
});

describe("session-local calibration", () => {
  it("captures a seated upper-body range when knees are obscured", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      visibility: 1,
    }));
    landmarks[11] = { x: 0.4, y: 0.3, visibility: 1 };
    landmarks[12] = { x: 0.6, y: 0.3, visibility: 1 };
    landmarks[15] = { x: 0.2, y: 0.2, visibility: 1 };
    landmarks[16] = { x: 0.8, y: 0.2, visibility: 1 };
    landmarks[25].visibility = 0.1;
    landmarks[26].visibility = 0.1;

    expect(captureCalibrationSample(landmarks)).toMatchObject({
      kneeLoad: 1.1,
      confidence: 1,
    });
  });

  it("round-trips an inspectable record only for its exact session key", () => {
    const record = createCalibrationRecord(
      "dance-coach-ROOM12345678",
      sample(),
      sample({ armReach: 1, poseSpread: 1.8 }),
      "camera",
      "2026-11-19T00:00:00.000Z",
    );
    const raw = JSON.stringify(record);
    expect(calibrationStorageKey(record.sessionId)).toBe(
      "move-canvas:calibration:dance-coach-ROOM12345678",
    );
    expect(parseCalibrationRecord(raw, record.sessionId)).toEqual(record);
    expect(parseCalibrationRecord(raw, "another-session")).toBeNull();
  });

  it("derives bounded Dance and Tennis thresholds from comfortable range", () => {
    const compact = createCalibrationRecord(
      "session-compact",
      sample(),
      sample({ armReach: 0.9, kneeLoad: 1.2, shoulderTurn: 0.1, poseSpread: 1.2 }),
    );
    const broad = createCalibrationRecord(
      "session-broad",
      sample(),
      sample({ armReach: 1.8, kneeLoad: 2, shoulderTurn: 0.3, poseSpread: 3.2 }),
    );
    expect(calibrationThresholds(compact)).toEqual({
      danceMismatchDistance: 0.58,
      serveReach: 0.765,
      forehandLoad: 1.08,
      forehandTurn: 0.08,
    });
    expect(calibrationThresholds(broad)).toEqual({
      danceMismatchDistance: 0.82,
      serveReach: 1.25,
      forehandLoad: 1.5,
      forehandTurn: 0.14,
    });

    const nearReach: TennisObservation = {
      confidence: 0.9,
      wristHeight: 1,
      wristAcrossBody: 0,
      wristBehindBody: 0,
      shoulderTurn: 0,
      kneeLoad: 1,
    };
    expect(classifyTennisPhase(nearReach, "shadow-serve", compact)).toBe("reach-proxy");
    expect(classifyTennisPhase(nearReach, "shadow-serve", broad)).toBeNull();
  });
});
