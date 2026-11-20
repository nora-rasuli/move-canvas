import { describe, expect, it } from "vitest";
import { createFallbackBlueprint } from "./blueprint";
import { initialGameState, reduceGame } from "./engine";

const blueprint = createFallbackBlueprint("A space courier game");

describe("game engine", () => {
  it("scores, pauses, resumes, and finishes deterministically", () => {
    let state = reduceGame(initialGameState(), { type: "start" }, blueprint);
    state = reduceGame(state, { type: "collect", gesture: "reach_left" }, blueprint);
    state = reduceGame(state, { type: "pause" }, blueprint);
    const frozen = reduceGame(state, { type: "tick", deltaMs: 5000 }, blueprint);
    expect(frozen.elapsedMs).toBe(0);
    state = reduceGame(frozen, { type: "resume" }, blueprint);
    state = reduceGame(
      state,
      { type: "tick", deltaMs: blueprint.durationSeconds * 1_000 },
      blueprint,
    );
    expect(state.score).toBe(10);
    expect(state.phase).toBe("finished");
  });

  it("ends safely when lives reach zero", () => {
    let state = reduceGame(initialGameState(), { type: "start" }, blueprint);
    for (let index = 0; index < 3; index += 1) {
      state = reduceGame(state, { type: "hit", gesture: "duck" }, blueprint);
    }
    expect(state.lives).toBe(0);
    expect(state.phase).toBe("finished");
  });
});
