import { describe, expect, it } from "vitest";
import { createFallbackBlueprint } from "./blueprint";
import { initialGameState, reduceGame } from "./engine";
import {
  applyGesture,
  challengeAt,
  CHALLENGE_WINDOW_MS,
  tickGame,
  type DisplayState,
} from "../components/game-display";

const game = createFallbackBlueprint("An ocean treasure hunt with pearls");

function started(): DisplayState {
  return {
    ...reduceGame(initialGameState(), { type: "start" }, game),
    challenge: challengeAt(game, 0, 0),
    eventsReceived: 0,
    players: [
      { id: "p1", name: "Nora", color: "#C8FF54", score: 0 },
      { id: "p2", name: "Sam", color: "#FF6B62", score: 0 },
    ],
  };
}

describe("complete display game session", () => {
  it("scores only the required semantic gesture and advances the challenge", () => {
    const state = started();
    const wrong = applyGesture(state, "p1", "duck", game);
    expect(wrong.score).toBe(0);
    expect(wrong.eventsReceived).toBe(1);

    const correct = applyGesture(wrong, "p2", state.challenge!.requiredGesture, game);
    expect(correct.score).toBe(game.pointsPerCollectible);
    expect(correct.challenge?.index).toBe(1);
    expect(correct.eventsReceived).toBe(2);
    expect(correct.players.find((player) => player.id === "p2")?.score).toBe(
      game.pointsPerCollectible,
    );
    expect(correct.players.find((player) => player.id === "p1")?.score).toBe(0);
  });

  it("deducts a life when the movement window expires", () => {
    const missed = tickGame(started(), game, CHALLENGE_WINDOW_MS);
    expect(missed.lives).toBe(2);
    expect(missed.challenge?.index).toBe(1);
  });

  it("finishes safely after three missed challenges", () => {
    let state = started();
    state = tickGame(state, game, CHALLENGE_WINDOW_MS);
    state = tickGame(state, game, CHALLENGE_WINDOW_MS);
    state = tickGame(state, game, CHALLENGE_WINDOW_MS);
    expect(state.phase).toBe("finished");
    expect(state.lives).toBe(0);
    expect(state.challenge).toBeNull();
  });
});
