import type { Landmark } from "./pose";

export type CalibrationSample = {
  armReach: number;
  kneeLoad: number;
  shoulderTurn: number;
  poseSpread: number;
  confidence: number;
};

export type CoachCalibrationRecord = {
  version: "1.1";
  sessionId: string;
  createdAt: string;
  neutral: CalibrationSample;
  comfortableRange: CalibrationSample;
  source: "camera" | "fixture";
};

const round3 = (value: number) => Math.round(value * 1_000) / 1_000;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function captureCalibrationSample(landmarks: Landmark[]): CalibrationSample | null {
  const points = [11, 12, 15, 16, 23, 24, 25, 26].map((index) => landmarks[index]);
  if (points.some((point) => !point)) return null;
  const [leftShoulder, rightShoulder, leftWrist, rightWrist, leftHip, rightHip, leftKnee, rightKnee] = points;
  const shoulderWidth = Math.max(Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y), 0.08);
  const centerX = (leftHip.x + rightHip.x) / 2;
  const centerY = (leftHip.y + rightHip.y) / 2;
  const armReach = Math.max((leftShoulder.y - leftWrist.y) / shoulderWidth, (rightShoulder.y - rightWrist.y) / shoulderWidth);
  const kneeLoad = ((leftKnee.y - leftHip.y) + (rightKnee.y - rightHip.y)) / (2 * shoulderWidth);
  const shoulderTurn = Math.abs((leftShoulder.z ?? 0) - (rightShoulder.z ?? 0)) / shoulderWidth;
  const poseSpread = points.reduce((sum, point) => sum + Math.hypot(point.x - centerX, point.y - centerY), 0) / (points.length * shoulderWidth);
  const confidence = points.reduce((sum, point) => sum + (point.visibility ?? 1), 0) / points.length;
  return { armReach: round3(armReach), kneeLoad: round3(kneeLoad), shoulderTurn: round3(shoulderTurn), poseSpread: round3(poseSpread), confidence: round3(confidence) };
}

export function createCalibrationRecord(
  sessionId: string,
  neutral: CalibrationSample,
  comfortableRange: CalibrationSample,
  source: CoachCalibrationRecord["source"] = "camera",
  createdAt = new Date().toISOString(),
): CoachCalibrationRecord {
  return { version: "1.1", sessionId, createdAt, neutral, comfortableRange, source };
}

export function calibrationStorageKey(sessionId: string) {
  return `move-canvas:calibration:${sessionId}`;
}

export function parseCalibrationRecord(raw: string | null, sessionId: string): CoachCalibrationRecord | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CoachCalibrationRecord>;
    const samples = [value.neutral, value.comfortableRange];
    const validSamples = samples.every((sample) => sample && [sample.armReach, sample.kneeLoad, sample.shoulderTurn, sample.poseSpread, sample.confidence].every(Number.isFinite));
    return value.version === "1.1" && value.sessionId === sessionId && (value.source === "camera" || value.source === "fixture") && typeof value.createdAt === "string" && validSamples
      ? value as CoachCalibrationRecord
      : null;
  } catch {
    return null;
  }
}

export function calibrationThresholds(record?: CoachCalibrationRecord | null) {
  if (!record) return { danceMismatchDistance: 0.68, serveReach: 1.25, forehandLoad: 1.5, forehandTurn: 0.14 };
  const spreadDelta = Math.max(0, record.comfortableRange.poseSpread - record.neutral.poseSpread);
  return {
    danceMismatchDistance: round3(clamp(0.58 + spreadDelta * 0.12, 0.58, 0.82)),
    serveReach: round3(clamp(record.comfortableRange.armReach * 0.85, 0.75, 1.25)),
    forehandLoad: round3(clamp(record.comfortableRange.kneeLoad * 0.9, 1.05, 1.5)),
    forehandTurn: round3(clamp(record.comfortableRange.shoulderTurn * 0.8, 0.08, 0.14)),
  };
}

export const FIXTURE_CALIBRATION_SAMPLES = {
  neutral: { armReach: 0.2, kneeLoad: 1.25, shoulderTurn: 0.05, poseSpread: 1.35, confidence: 0.95 },
  comfortableRange: { armReach: 1.4, kneeLoad: 1.7, shoulderTurn: 0.2, poseSpread: 2.1, confidence: 0.95 },
} satisfies Record<"neutral" | "comfortableRange", CalibrationSample>;
