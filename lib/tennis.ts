import type { Landmark } from "./pose";
import { calibrationThresholds, type CoachCalibrationRecord } from "./calibration";
import {
  TENNIS_LIMITATION,
  type CoachResult,
  type Handedness,
  type TennisDrill,
  type TennisPhase,
} from "./coach";

export const TENNIS_CONFIG_VERSION = "tennis-rules-1.1.0";
export const TENNIS_MIN_CONFIDENCE = 0.55;

export type TennisObservation = {
  confidence: number;
  wristHeight: number;
  wristAcrossBody: number;
  wristBehindBody: number;
  shoulderTurn: number;
  kneeLoad: number;
};

export type TennisRep = {
  drill: TennisDrill;
  phases: TennisPhase[];
  confidence: number;
  issues: string[];
};

export const PHASES: Record<TennisDrill, TennisPhase[]> = {
  "shadow-serve": ["ready", "trophy", "reach-proxy", "follow-through"],
  "shadow-forehand": ["ready", "unit-turn", "load", "contact-zone-proxy", "finish"],
  "shadow-backhand": ["ready", "unit-turn", "load", "contact-zone-proxy", "finish"],
  "shadow-volley": ["ready", "unit-turn", "contact-zone-proxy", "finish"],
};

export function observeTennisPose(
  landmarks: Landmark[],
  handedness: Handedness,
): TennisObservation | null {
  const shoulder = landmarks[handedness === "right" ? 12 : 11];
  const oppositeShoulder = landmarks[handedness === "right" ? 11 : 12];
  const wrist = landmarks[handedness === "right" ? 16 : 15];
  const hip = landmarks[handedness === "right" ? 24 : 23];
  const oppositeHip = landmarks[handedness === "right" ? 23 : 24];
  const knee = landmarks[handedness === "right" ? 26 : 25];
  const points = [shoulder, oppositeShoulder, wrist, hip, oppositeHip, knee];
  if (points.some((point) => !point)) return null;
  const confidence =
    points.reduce((sum, point) => sum + (point.visibility ?? 1), 0) / points.length;
  if (confidence < TENNIS_MIN_CONFIDENCE) return null;
  const direction = handedness === "right" ? 1 : -1;
  const shoulderWidth = Math.max(Math.abs(shoulder.x - oppositeShoulder.x), 0.08);
  return {
    confidence,
    wristHeight: (shoulder.y - wrist.y) / shoulderWidth,
    wristAcrossBody: ((oppositeShoulder.x - wrist.x) * direction) / shoulderWidth,
    wristBehindBody: ((wrist.x - shoulder.x) * direction) / shoulderWidth,
    shoulderTurn: Math.abs(shoulder.z ?? 0) - Math.abs(oppositeShoulder.z ?? 0),
    kneeLoad: (knee.y - hip.y) / shoulderWidth,
  };
}

export function classifyTennisPhase(
  observation: TennisObservation,
  drill: TennisDrill,
  calibration?: CoachCalibrationRecord | null,
): TennisPhase | null {
  if (observation.confidence < TENNIS_MIN_CONFIDENCE) return null;
  const thresholds = calibrationThresholds(calibration);
  if (drill === "shadow-serve") {
    if (observation.wristAcrossBody > 0.75 && observation.wristHeight < 0.35)
      return "follow-through";
    if (observation.wristHeight > thresholds.serveReach) return "reach-proxy";
    if (observation.wristHeight > 0.35 && observation.wristBehindBody > 0.15) return "trophy";
    if (Math.abs(observation.wristBehindBody) < 0.45 && observation.wristHeight < 0.35)
      return "ready";
    return null;
  }
  if (drill === "shadow-backhand") {
    if (observation.wristAcrossBody < -0.65 && observation.wristHeight > -0.2) return "finish";
    if (observation.wristBehindBody > 0.55 && Math.abs(observation.wristHeight) < 0.7)
      return "contact-zone-proxy";
    if (observation.kneeLoad > thresholds.forehandLoad && observation.wristBehindBody < -0.35)
      return "load";
    if (Math.abs(observation.shoulderTurn) > thresholds.forehandTurn) return "unit-turn";
    if (Math.abs(observation.wristBehindBody) < 0.45 && Math.abs(observation.wristHeight) < 0.5)
      return "ready";
    return null;
  }
  if (drill === "shadow-volley") {
    if (Math.abs(observation.wristAcrossBody) > 0.6 && observation.wristHeight > -0.35)
      return "finish";
    if (Math.abs(observation.wristBehindBody) > 0.45 && Math.abs(observation.wristHeight) < 0.65)
      return "contact-zone-proxy";
    if (Math.abs(observation.shoulderTurn) > thresholds.forehandTurn) return "unit-turn";
    if (Math.abs(observation.wristBehindBody) < 0.35 && Math.abs(observation.wristHeight) < 0.5)
      return "ready";
    return null;
  }
  if (observation.wristAcrossBody > 0.75 && observation.wristHeight > 0.1) return "finish";
  if (observation.wristBehindBody < -0.55 && Math.abs(observation.wristHeight) < 0.7)
    return "contact-zone-proxy";
  if (observation.kneeLoad > thresholds.forehandLoad && observation.wristBehindBody > 0.35)
    return "load";
  if (Math.abs(observation.shoulderTurn) > thresholds.forehandTurn) return "unit-turn";
  if (Math.abs(observation.wristBehindBody) < 0.45 && Math.abs(observation.wristHeight) < 0.5)
    return "ready";
  return null;
}

export class TennisRepTracker {
  private index = 0;
  private phases: TennisPhase[] = [];
  private confidences: number[] = [];
  private issues: string[] = [];

  constructor(readonly drill: TennisDrill) {}

  ingest(phase: TennisPhase | null, observation: TennisObservation): TennisRep | null {
    if (!phase || observation.confidence < TENNIS_MIN_CONFIDENCE) return null;
    const expected = PHASES[this.drill][this.index];
    if (phase !== expected) {
      if (phase === "ready") {
        this.index = 1;
        this.phases = ["ready"];
        this.confidences = [observation.confidence];
        this.issues = [];
      }
      return null;
    }
    this.phases.push(phase);
    this.confidences.push(observation.confidence);
    this.issues.push(...observationIssues(observation, this.drill, phase));
    this.index += 1;
    if (this.index < PHASES[this.drill].length) return null;
    const rep = {
      drill: this.drill,
      phases: [...this.phases],
      confidence: average(this.confidences),
      issues: [...new Set(this.issues)],
    };
    this.reset();
    return rep;
  }

  reset() {
    this.index = 0;
    this.phases = [];
    this.confidences = [];
    this.issues = [];
  }
}

export function summarizeTennisReps(reps: TennisRep[]): CoachResult {
  const issueCounts = new Map<string, number>();
  for (const rep of reps)
    for (const issue of new Set(rep.issues))
      issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
  const cues = [...issueCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([code, count]) => ({
      code,
      text: issueCopy(code),
      confidence: count / Math.max(reps.length, 1),
    }));
  if (!cues.length && reps.length >= 3)
    cues.push({
      code: "ordered-phases",
      text: "All three visible shadow reps followed the supported phase order.",
      confidence: average(reps.map((rep) => rep.confidence)),
    });
  return {
    mode: "tennis-coach",
    completedAt: new Date().toISOString(),
    confidence: average(reps.map((rep) => rep.confidence)),
    completedUnits: reps.length,
    cues,
    limitation: TENNIS_LIMITATION,
  };
}

function observationIssues(observation: TennisObservation, drill: TennisDrill, phase: TennisPhase) {
  const issues: string[] = [];
  if (drill === "shadow-serve" && phase === "trophy" && observation.wristHeight < 0.6)
    issues.push("serve-trophy-height");
  if (
    (drill === "shadow-forehand" || drill === "shadow-backhand") &&
    phase === "unit-turn" &&
    Math.abs(observation.shoulderTurn) < 0.25
  )
    issues.push(`${drill === "shadow-backhand" ? "backhand" : "forehand"}-turn-range`);
  if (phase === "reach-proxy" && observation.wristHeight < 1.5) issues.push("serve-reach-range");
  return issues;
}

function issueCopy(code: string) {
  if (code === "serve-trophy-height")
    return "In repeated visible reps, pause with the hand clearly above shoulder level in the trophy phase.";
  if (code === "serve-reach-range")
    return "In repeated visible reps, extend the shadow reach higher before follow-through.";
  if (code === "backhand-turn-range")
    return "In repeated visible reps, show a clearer shoulder turn before the backhand moves forward.";
  return "In repeated visible reps, show a clearer shoulder turn before the shadow swing moves forward.";
}

const average = (values: number[]) =>
  values.length
    ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1_000) / 1_000
    : 0;
