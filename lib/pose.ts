import { z } from "zod";
import { gestureSchema, type Gesture } from "./blueprint";

export type Landmark = { x: number; y: number; z?: number; visibility?: number };

export type PoseFrame = {
  capturedAt: number;
  landmarks: Landmark[];
};

export type CalibrationProfile = {
  version: "1.0";
  capturedAt: string;
  samples: Partial<Record<Gesture, PoseFrame>>;
};

const landmarkSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite().optional(),
  visibility: z.number().min(0).max(1).optional(),
});

const poseFrameSchema = z.object({
  capturedAt: z.number().finite().nonnegative(),
  landmarks: z.array(landmarkSchema).min(27).max(64),
});

export const calibrationProfileSchema = z.object({
  version: z.literal("1.0"),
  capturedAt: z.string().min(1).max(80),
  samples: z.partialRecord(gestureSchema, poseFrameSchema),
});

export function parseCalibrationProfile(raw: string | null): CalibrationProfile | null {
  if (!raw) return null;
  try {
    return calibrationProfileSchema.safeParse(JSON.parse(raw)).data ?? null;
  } catch {
    return null;
  }
}

const INDEX = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
} as const;

export function hasTrackableBody(landmarks: Landmark[]) {
  return Object.values(INDEX).every((index) => {
    const point = landmarks[index];
    return point && (point.visibility ?? 1) >= 0.55;
  });
}

export function poseMetric(gesture: Gesture, landmarks: Landmark[]) {
  if (!hasTrackableBody(landmarks)) return null;
  const leftShoulder = landmarks[INDEX.leftShoulder];
  const rightShoulder = landmarks[INDEX.rightShoulder];
  const leftWrist = landmarks[INDEX.leftWrist];
  const rightWrist = landmarks[INDEX.rightWrist];
  const leftHip = landmarks[INDEX.leftHip];
  const rightHip = landmarks[INDEX.rightHip];

  if (gesture === "reach_left") return leftShoulder.x - leftWrist.x;
  if (gesture === "reach_right") return rightWrist.x - rightShoulder.x;
  if (gesture === "duck") return (leftShoulder.y + rightShoulder.y) / 2;
  return (Math.abs(leftWrist.y - leftHip.y) + Math.abs(rightWrist.y - rightHip.y)) / 2;
}

export function classifyPose(landmarks: Landmark[], profile: CalibrationProfile): Gesture | null {
  if (!hasTrackableBody(landmarks)) return null;
  const order: Gesture[] = ["duck", "reach_left", "reach_right"];
  for (const gesture of order) {
    const sample = profile.samples[gesture];
    if (!sample) continue;
    const current = poseMetric(gesture, landmarks);
    const target = poseMetric(gesture, sample.landmarks);
    if (current === null || target === null) continue;
    if (gesture === "duck" && current >= target * 0.92) return gesture;
    if (gesture !== "duck" && current >= target * 0.82) return gesture;
  }
  return "freeze";
}
