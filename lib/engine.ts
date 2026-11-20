import type { GameBlueprint, Gesture } from "./blueprint";

export type GamePhase = "ready" | "playing" | "paused" | "finished";

export type GameState = {
  phase: GamePhase;
  score: number;
  lives: number;
  elapsedMs: number;
  streak: number;
  lastGesture: Gesture | null;
};

export const initialGameState = (): GameState => ({
  phase: "ready",
  score: 0,
  lives: 3,
  elapsedMs: 0,
  streak: 0,
  lastGesture: null,
});

export type EngineEvent =
  | { type: "start" }
  | { type: "tick"; deltaMs: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "collect"; gesture: Gesture }
  | { type: "hit"; gesture: Gesture };

export function reduceGame(
  state: GameState,
  event: EngineEvent,
  blueprint: GameBlueprint,
): GameState {
  if (event.type === "start" && state.phase === "ready") {
    return { ...state, phase: "playing" };
  }
  if (event.type === "pause" && state.phase === "playing") {
    return { ...state, phase: "paused" };
  }
  if (event.type === "resume" && state.phase === "paused") {
    return { ...state, phase: "playing" };
  }
  if (state.phase !== "playing") return state;

  if (event.type === "tick") {
    const elapsedMs = Math.min(
      state.elapsedMs + Math.max(0, event.deltaMs),
      blueprint.durationSeconds * 1000,
    );
    return {
      ...state,
      elapsedMs,
      phase: elapsedMs >= blueprint.durationSeconds * 1000 ? "finished" : "playing",
    };
  }
  if (event.type === "collect") {
    const streak = state.streak + 1;
    return {
      ...state,
      streak,
      lastGesture: event.gesture,
      score: state.score + blueprint.pointsPerCollectible + Math.min(streak - 1, 5),
    };
  }
  if (event.type === "hit") {
    const lives = Math.max(0, state.lives - 1);
    return {
      ...state,
      lives,
      streak: 0,
      lastGesture: event.gesture,
      phase: lives === 0 ? "finished" : "playing",
    };
  }
  return state;
}
