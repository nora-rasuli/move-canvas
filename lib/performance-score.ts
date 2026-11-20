import type { PerformanceScore, ScoreComponents } from "./coach";

const WEIGHTS = {
  movementMatch: 0.35,
  timingOrSequence: 0.25,
  completion: 0.25,
  trackingConfidence: 0.15,
} satisfies Record<keyof ScoreComponents, number>;

export function percentage(value: number) {
  return Math.round(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100);
}

export function buildPerformanceScore(components: ScoreComponents): PerformanceScore {
  const normalized = Object.fromEntries(
    Object.entries(components).map(([key, value]) => [
      key,
      Math.round(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))),
    ]),
  ) as ScoreComponents;
  const total = Math.round(
    (Object.entries(WEIGHTS) as [keyof ScoreComponents, number][]).reduce(
      (sum, [key, weight]) => sum + normalized[key] * weight,
      0,
    ),
  );
  return { version: "session-score-1.0", total, components: normalized };
}

export function scoreExplanation(mode: "dance-coach" | "tennis-coach") {
  return mode === "dance-coach"
    ? "Movement match 35% · timing 25% · clear comparisons 25% · tracking confidence 15%"
    : "Movement phases 35% · phase order 25% · three-rep completion 25% · tracking confidence 15%";
}
