"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { GameBlueprint, Gesture } from "@/lib/blueprint";
import { writeBrowserStorage } from "@/lib/browser-storage";
import {
  connectSession,
  type GameResult,
  type Player,
  type PlayerScore,
  type SessionConnection,
} from "@/lib/channel";
import { initialGameState, reduceGame, type GameState } from "@/lib/engine";

type Challenge = {
  index: number;
  kind: "collect" | "dodge";
  requiredGesture: Gesture;
  startedAtMs: number;
};

export type DisplayState = GameState & {
  challenge: Challenge | null;
  eventsReceived: number;
  players: PlayerScore[];
};

export const CHALLENGE_WINDOW_MS = 4_000;

const freshDisplayState = (): DisplayState => ({
  ...initialGameState(),
  challenge: null,
  eventsReceived: 0,
  players: [],
});

export function GameDisplay({ code }: { code: string }) {
  const connectionRef = useRef<SessionConnection | null>(null);
  const connectionPromiseRef = useRef<Promise<SessionConnection> | null>(null);
  const connectionGenerationRef = useRef(0);
  const gameRef = useRef<GameBlueprint | null>(null);
  const resultSentRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [game, setGame] = useState<GameBlueprint | null>(null);
  const [state, setState] = useState<DisplayState>(freshDisplayState);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(
      () => setJoinUrl(`${window.location.origin}/pair?code=${code}`),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    const generation = ++connectionGenerationRef.current;
    if (!connectionPromiseRef.current) {
      connectionPromiseRef.current = connectSession(
        code,
        (message) => {
          if (message.type === "controller-ready") {
            setConnected(true);
            setState((current) => ({
              ...current,
              players: upsertPlayer(current.players, message.player),
            }));
            if (gameRef.current) {
              void connectionRef.current?.send({ type: "blueprint", payload: gameRef.current });
              void connectionRef.current?.send({ type: "display-ready" });
            }
          }
          if (message.type === "controller-left") {
            setState((current) => ({
              ...current,
              players: current.players.filter((player) => player.id !== message.playerId),
            }));
          }
          if (message.type === "blueprint") {
            const blueprint = message.payload;
            gameRef.current = blueprint;
            setConnected(true);
            setGame(blueprint);
            void connectionRef.current?.send({ type: "blueprint", payload: blueprint });
            void connectionRef.current?.send({ type: "display-ready" });
          }
          if (message.type === "start" && gameRef.current) {
            resultSentRef.current = false;
            const started = reduceGame(initialGameState(), { type: "start" }, gameRef.current);
            setState((current) => ({
              ...started,
              challenge: challengeAt(gameRef.current!, 0, 0),
              eventsReceived: 0,
              players: current.players.map((player) => ({ ...player, score: 0 })),
            }));
          }
          if (message.type === "pause" && gameRef.current) {
            setState((current) => ({
              ...reduceGame(current, { type: "pause" }, gameRef.current!),
              challenge: current.challenge,
              eventsReceived: current.eventsReceived,
              players: current.players,
            }));
          }
          if (message.type === "resume" && gameRef.current) {
            setState((current) => ({
              ...reduceGame(current, { type: "resume" }, gameRef.current!),
              challenge: current.challenge,
              eventsReceived: current.eventsReceived,
              players: current.players,
            }));
          }
          if (message.type === "gesture" && gameRef.current) {
            setConnected(true);
            setState((current) =>
              applyGesture(current, message.playerId, message.gesture, gameRef.current!),
            );
          }
        },
        (ready) => {
          if (!ready) setConnected(false);
        },
      );
    }
    const connectionPromise = connectionPromiseRef.current;
    void connectionPromise.then((connection) => {
      if (generation !== connectionGenerationRef.current) return;
      connectionRef.current = connection;
    });
    return () => {
      const cleanupGeneration = generation;
      window.setTimeout(() => {
        // Strict Mode remounts immediately; only a genuine unmount keeps this generation current.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (connectionGenerationRef.current !== cleanupGeneration) return;
        void connectionPromise.then(async (connection) => {
          await connection.close();
          if (connectionPromiseRef.current === connectionPromise)
            connectionPromiseRef.current = null;
        });
      }, 0);
    };
  }, [code]);

  useEffect(() => {
    if (!game || state.phase !== "playing") return;
    const timer = window.setInterval(() => {
      setState((current) => tickGame(current, game, 100));
    }, 100);
    return () => window.clearInterval(timer);
  }, [game, state.phase]);

  useEffect(() => {
    if (!game) return;
    const remainingSeconds = Math.max(0, Math.ceil(game.durationSeconds - state.elapsedMs / 1000));
    void connectionRef.current?.send({
      type: "game-state",
      phase: state.phase,
      score: state.score,
      lives: state.lives,
      remainingSeconds,
      requiredGesture: state.challenge?.requiredGesture ?? null,
      players: state.players,
    });
    if (state.phase === "finished" && !resultSentRef.current) {
      resultSentRef.current = true;
      const result: GameResult = {
        gameTitle: game.title,
        score: state.score,
        leaderboard: [...state.players].sort((a, b) => b.score - a.score),
        completedAt: new Date().toISOString(),
        durationSeconds: Math.round(state.elapsedMs / 1000),
        eventsReceived: state.eventsReceived,
      };
      writeBrowserStorage("local", "move-canvas:last-result", JSON.stringify(result));
      void connectionRef.current?.send({ type: "result", result });
    }
  }, [game, state]);

  const remaining = game
    ? Math.max(0, Math.ceil(game.durationSeconds - state.elapsedMs / 1000))
    : 0;
  const style = game
    ? ({
        "--display-accent": game.theme.palette[1],
        "--display-bg": game.theme.palette[0],
      } as React.CSSProperties)
    : undefined;

  const leader = [...state.players].sort((a, b) => b.score - a.score)[0];

  return (
    <main id="main" className={`display-page game-phase-${state.phase}`} style={style}>
      <header className="game-hud">
        <div className="display-status">
          <span className={connected ? "connection-light connected" : "connection-light"} />
          {connected ? "Controller connected" : "Waiting for controller"}
          <small>{code}</small>
        </div>
        {game ? (
          <div className="game-stats">
            <span>
              Team <strong>{state.score}</strong>
            </span>
            <span>
              Players <strong>{state.players.length}</strong>
            </span>
            <span>
              Time <strong>{remaining}</strong>
            </span>
            <span>
              Lives{" "}
              <strong>
                {"●".repeat(state.lives)}
                {"○".repeat(3 - state.lives)}
              </strong>
            </span>
          </div>
        ) : null}
      </header>

      {!game ? (
        <section className="display-pairing">
          <p className="eyebrow">MOVE CANVAS DISPLAY · ROOM {code}</p>
          <h1>Join with your phone.</h1>
          {joinUrl ? (
            <QRCodeSVG value={joinUrl} size={220} bgColor="#f5f0e7" fgColor="#171524" level="M" />
          ) : null}
          <p>Every phone becomes a motion controller.</p>
        </section>
      ) : state.phase === "ready" ? (
        <section className="game-intro">
          <p className="eyebrow">{game.theme.world.toUpperCase()}</p>
          <h1>{game.title}</h1>
          <p>{game.oneLine}</p>
          <div className="display-players">
            {state.players.map((player) => (
              <span
                key={player.id}
                style={{ "--player-color": player.color } as React.CSSProperties}
              >
                {player.name}
              </span>
            ))}
          </div>
          <div className="display-wait">Start the round from your phone</div>
        </section>
      ) : state.phase === "finished" ? (
        <section className="game-result" aria-live="polite">
          <p className="eyebrow">ROUND COMPLETE</p>
          <h1>{state.score}</h1>
          <p>
            team points · {state.eventsReceived} controller events
            {leader ? ` · ${leader.name} leads with ${leader.score}` : ""}
          </p>
          <div className="leaderboard">
            {[...state.players]
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div key={player.id}>
                  <span>
                    {index + 1}. {player.name}
                  </span>
                  <strong>{player.score}</strong>
                </div>
              ))}
          </div>
          <div className="display-wait">Replay from your phone or close this display</div>
        </section>
      ) : (
        <section className="game-arena" aria-live="polite">
          <p className="challenge-kind">
            {state.phase === "paused"
              ? "PAUSED"
              : state.challenge?.kind === "dodge"
                ? `DODGE THE ${game.theme.hazard.toUpperCase()}`
                : `CATCH THE ${game.theme.collectible.toUpperCase()}`}
          </p>
          <div
            className={`challenge-object ${state.challenge?.kind ?? "collect"}`}
            aria-hidden="true"
          >
            {state.challenge?.kind === "dodge" ? "◆" : "✦"}
          </div>
          <h1>
            {state.phase === "paused"
              ? "Hold still"
              : formatGesture(state.challenge?.requiredGesture ?? "freeze")}
          </h1>
          <p>
            {state.phase === "paused"
              ? "Resume from the controller when you are ready."
              : "Move before the ring closes."}
          </p>
          <div className="challenge-timer" key={state.challenge?.index} aria-hidden="true" />
        </section>
      )}
    </main>
  );
}

export function challengeAt(game: GameBlueprint, index: number, startedAtMs: number): Challenge {
  return {
    index,
    kind: index % 4 === 2 ? "dodge" : "collect",
    requiredGesture: game.gestures[index % game.gestures.length],
    startedAtMs,
  };
}

export function applyGesture(
  state: DisplayState,
  playerId: string,
  gesture: Gesture,
  game: GameBlueprint,
): DisplayState {
  const eventsReceived = state.eventsReceived + 1;
  if (state.phase !== "playing" || !state.challenge)
    return { ...state, lastGesture: gesture, eventsReceived };
  if (gesture !== state.challenge.requiredGesture)
    return { ...state, lastGesture: gesture, eventsReceived };
  const next = reduceGame(state, { type: "collect", gesture }, game);
  const points = next.score - state.score;
  return {
    ...next,
    challenge: challengeAt(game, state.challenge.index + 1, state.elapsedMs),
    eventsReceived,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, score: player.score + points } : player,
    ),
  };
}

export function upsertPlayer(players: PlayerScore[], player: Player): PlayerScore[] {
  const existing = players.find((entry) => entry.id === player.id);
  if (!existing) return [...players, { ...player, score: 0 }];
  return players.map((entry) => (entry.id === player.id ? { ...entry, ...player } : entry));
}

export function tickGame(state: DisplayState, game: GameBlueprint, deltaMs: number): DisplayState {
  if (state.phase !== "playing") return state;
  let next = reduceGame(state, { type: "tick", deltaMs }, game);
  if (next.phase === "finished")
    return {
      ...next,
      challenge: null,
      eventsReceived: state.eventsReceived,
      players: state.players,
    };
  const challenge = state.challenge;
  if (challenge && next.elapsedMs - challenge.startedAtMs >= CHALLENGE_WINDOW_MS) {
    next = reduceGame(next, { type: "hit", gesture: challenge.requiredGesture }, game);
    return {
      ...next,
      challenge:
        next.phase === "finished" ? null : challengeAt(game, challenge.index + 1, next.elapsedMs),
      eventsReceived: state.eventsReceived,
      players: state.players,
    };
  }
  return { ...next, challenge, eventsReceived: state.eventsReceived, players: state.players };
}

const formatGesture = (gesture: Gesture) =>
  gesture
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
