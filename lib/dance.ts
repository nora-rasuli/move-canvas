import type { Landmark, PoseFrame } from "./pose";
import { calibrationThresholds, type CoachCalibrationRecord } from "./calibration";
import {
  DANCE_LIMITATION,
  serializedBytes,
  type BodyRegion,
  type CoachResult,
  type DanceFeedbackEvent,
  type DanceTimeline,
  type NormalizedPoint,
  type NormalizedReferenceFrame,
} from "./coach";

export const DANCE_CONFIG_VERSION = "dance-rules-1.1.0";
export const DANCE_SAMPLE_INTERVAL_MS = 100;
export const DANCE_MAX_PAYLOAD_BYTES = 1_048_576;
export const DANCE_TIMING_THRESHOLD_MS = 250;
export const DANCE_MIN_CONFIDENCE = 0.55;

export const DANCE_JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28] as const;

const REGIONS: Record<BodyRegion, number[]> = {
  arms: [0, 1, 2, 3, 4, 5],
  torso: [0, 1, 6, 7],
  legs: [6, 7, 8, 9, 10, 11],
};

export type DanceOrientation = DanceTimeline["orientation"];

export function normalizeDancePose(
  landmarks: Landmark[],
  orientation: DanceOrientation = "lead-left",
  capturedAt = 0,
): NormalizedReferenceFrame | null {
  const selected = DANCE_JOINTS.map((index) => landmarks[index]);
  if (selected.some((point) => !point)) return null;
  const confidence =
    selected.reduce((sum, point) => sum + (point.visibility ?? 1), 0) / selected.length;
  if (confidence < DANCE_MIN_CONFIDENCE) return null;

  const leftHip = selected[6];
  const rightHip = selected[7];
  const centerX = (leftHip.x + rightHip.x) / 2;
  const centerY = (leftHip.y + rightHip.y) / 2;
  const shoulderSpan = Math.hypot(selected[0].x - selected[1].x, selected[0].y - selected[1].y);
  const torsoHeight = Math.hypot(
    (selected[0].x + selected[1].x) / 2 - centerX,
    (selected[0].y + selected[1].y) / 2 - centerY,
  );
  const scale = Math.max(shoulderSpan, torsoHeight, 0.08);
  const mirror = orientation === "mirror" || orientation === "lead-right";
  const points = selected.map(
    (point) =>
      [
        round3(((point.x - centerX) / scale) * (mirror ? -1 : 1)),
        round3((point.y - centerY) / scale),
        round3(point.visibility ?? 1),
      ] as NormalizedPoint,
  );

  return { t: Math.max(0, Math.round(capturedAt)), c: round3(confidence), p: points };
}

export function buildDanceTimeline(
  frames: PoseFrame[],
  durationMs: number,
  orientation: DanceOrientation = "lead-left",
): DanceTimeline {
  if (durationMs < 10_000 || durationMs > 90_000) {
    throw new Error("Reference clips must be between 10 and 90 seconds.");
  }
  const normalized: NormalizedReferenceFrame[] = [];
  let nextSampleAt = 0;
  for (const frame of frames) {
    if (frame.capturedAt + 0.5 < nextSampleAt) continue;
    const sample = normalizeDancePose(frame.landmarks, orientation, frame.capturedAt);
    nextSampleAt = frame.capturedAt + DANCE_SAMPLE_INTERVAL_MS;
    if (sample) normalized.push(sample);
  }
  if (!normalized.length)
    throw new Error("No single, clearly visible person was found in the reference clip.");
  const timeline: DanceTimeline = {
    version: "1.1",
    durationMs: Math.round(durationMs),
    sampleHz: 10,
    orientation,
    frames: normalized.slice(0, 900),
  };
  if (serializedBytes(timeline) > DANCE_MAX_PAYLOAD_BYTES) {
    throw new Error("The normalized reference timeline exceeds the 1 MiB session limit.");
  }
  return timeline;
}

export function compareDancePose(
  timeline: DanceTimeline,
  landmarks: Landmark[],
  elapsedMs: number,
  calibration?: CoachCalibrationRecord | null,
): DanceFeedbackEvent {
  const user = normalizeDancePose(landmarks, timeline.orientation, elapsedMs);
  if (!user)
    return {
      timing: "low-confidence",
      region: null,
      offsetMs: null,
      confidence: 0,
      cue: "Pause and bring your shoulders, hands, and hips back into view.",
    };
  const nearby = timeline.frames.filter((frame) => Math.abs(frame.t - elapsedMs) <= 1_000);
  if (!nearby.length)
    return {
      timing: "low-confidence",
      region: null,
      offsetMs: null,
      confidence: user.c,
      cue: "Waiting for a clear reference pose.",
    };

  const ranked = nearby
    .map((frame) => ({ frame, distance: poseDistance(user, frame) }))
    .sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  const offsetMs = best.frame.t - elapsedMs;
  const region = largestRegionMismatch(
    user,
    timeline.frames.reduce((closest, frame) =>
      Math.abs(frame.t - elapsedMs) < Math.abs(closest.t - elapsedMs) ? frame : closest,
    ),
  );
  const confidence = round3(Math.min(user.c, best.frame.c));

  if (best.distance > calibrationThresholds(calibration).danceMismatchDistance) {
    return { timing: "form-mismatch", region, offsetMs, confidence, cue: regionCue(region) };
  }
  if (offsetMs >= DANCE_TIMING_THRESHOLD_MS) {
    return {
      timing: "early",
      region: null,
      offsetMs,
      confidence,
      cue: "Hold this shape a moment longer before the next change.",
    };
  }
  if (offsetMs <= -DANCE_TIMING_THRESHOLD_MS) {
    return {
      timing: "late",
      region: null,
      offsetMs,
      confidence,
      cue: "Begin the next shape a little sooner relative to the reference.",
    };
  }
  return {
    timing: "on-time",
    region: null,
    offsetMs,
    confidence,
    cue: "Timing is aligned with the selected reference.",
  };
}

export function summarizeDanceEvents(events: DanceFeedbackEvent[]): CoachResult {
  const qualified = events.filter(
    (event) => event.timing !== "low-confidence" && event.confidence >= DANCE_MIN_CONFIDENCE,
  );
  const counts = new Map<string, { event: DanceFeedbackEvent; count: number }>();
  for (const event of qualified) {
    if (event.timing === "on-time") continue;
    const key = `${event.timing}:${event.region ?? "timing"}`;
    const current = counts.get(key);
    counts.set(key, { event, count: (current?.count ?? 0) + 1 });
  }
  const cues = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map(({ event }) => ({
      code: `${event.timing}-${event.region ?? "timing"}`,
      text: event.cue,
      confidence: event.confidence,
    }));
  if (!cues.length)
    cues.push({
      code: "aligned",
      text: "Your clearest poses stayed close to the selected reference timing.",
      confidence: average(qualified.map((event) => event.confidence)),
    });
  return {
    mode: "dance-coach",
    completedAt: new Date().toISOString(),
    confidence: average(qualified.map((event) => event.confidence)),
    completedUnits: qualified.length,
    cues,
    limitation: DANCE_LIMITATION,
  };
}

function poseDistance(a: NormalizedReferenceFrame, b: NormalizedReferenceFrame) {
  return (
    a.p.reduce(
      (sum, point, index) => sum + Math.hypot(point[0] - b.p[index][0], point[1] - b.p[index][1]),
      0,
    ) / a.p.length
  );
}

function largestRegionMismatch(
  a: NormalizedReferenceFrame,
  b: NormalizedReferenceFrame,
): BodyRegion {
  return (Object.entries(REGIONS) as [BodyRegion, number[]][])
    .map(([region, indices]) => ({
      region,
      distance:
        indices.reduce(
          (sum, index) =>
            sum + Math.hypot(a.p[index][0] - b.p[index][0], a.p[index][1] - b.p[index][1]),
          0,
        ) / indices.length,
    }))
    .sort((a, b) => b.distance - a.distance)[0].region;
}

function regionCue(region: BodyRegion) {
  if (region === "arms") return "Check the arm shape against the reference before continuing.";
  if (region === "legs") return "Check the leg shape against the reference before continuing.";
  return "Check the torso shape against the reference before continuing.";
}

const round3 = (value: number) => Math.round(value * 1_000) / 1_000;
const average = (values: number[]) =>
  values.length ? round3(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
