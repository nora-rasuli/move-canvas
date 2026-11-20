"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  parseStoredBlueprint,
  parseStoredBlueprintRecord,
  type GameBlueprint,
  type Gesture,
} from "@/lib/blueprint";
import {
  readBrowserStorage,
  removeBrowserStorage,
  writeBrowserStorage,
} from "@/lib/browser-storage";
import {
  connectSession,
  createPlayer,
  createRoomCode,
  playerSchema,
  type GameResult,
  type Player,
  type PlayerScore,
  type SessionConnection,
} from "@/lib/channel";
import type { GamePhase } from "@/lib/engine";
import {
  classifyPose,
  hasTrackableBody,
  parseCalibrationProfile,
  type CalibrationProfile,
} from "@/lib/pose";
import { startPoseSession, type PoseSession } from "@/lib/pose-landmarker";

type ControllerState = {
  phase: GamePhase;
  score: number;
  lives: number;
  remainingSeconds: number;
  requiredGesture: Gesture | null;
  players: PlayerScore[];
};

type MotionState = "idle" | "requesting" | "tracking" | "out-of-frame" | "error";

const initialControllerState: ControllerState = {
  phase: "ready",
  score: 0,
  lives: 3,
  remainingSeconds: 0,
  requiredGesture: null,
  players: [],
};

export function PairingRoom() {
  const [code, setCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [gameJson, setGameJson] = useState<string | null>(null);
  const game = useMemo(() => parseStoredBlueprint(gameJson), [gameJson]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [connected, setConnected] = useState(false);
  const [transportReady, setTransportReady] = useState(false);
  const [mode, setMode] = useState<"supabase" | "same-device">("same-device");
  const [controller, setController] = useState(initialControllerState);
  const [result, setResult] = useState<GameResult | null>(null);
  const [motion, setMotion] = useState<MotionState>("idle");
  const [detectedGesture, setDetectedGesture] = useState<Gesture | null>(null);
  const connectionRef = useRef<SessionConnection | null>(null);
  const connectionPromiseRef = useRef<Promise<SessionConnection> | null>(null);
  const connectionGenerationRef = useRef(0);
  const gameRef = useRef<GameBlueprint | null>(null);
  const playerRef = useRef<Player | null>(null);
  const calibrationRef = useRef<CalibrationProfile | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseSessionRef = useRef<PoseSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPoseRef = useRef<{ gesture: Gesture | null; sentAt: number }>({
    gesture: null,
    sentAt: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCode(readRoomCode());
      setIsJoining(new URLSearchParams(window.location.search).has("code"));
      setOrigin(window.location.origin);
      setGameJson(readBrowserStorage("local", "move-canvas:active-blueprint"));
      const savedPlayer = readPlayer();
      playerRef.current = savedPlayer;
      setPlayer(savedPlayer);
      calibrationRef.current = parseCalibrationProfile(
        readBrowserStorage("local", "move-canvas:calibration"),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (!transportReady || connected || !player || !connectionRef.current) return;
    const announce = () => {
      void connectionRef.current?.send({ type: "controller-ready", player });
      if (gameRef.current)
        void connectionRef.current?.send({ type: "blueprint", payload: gameRef.current });
    };
    announce();
    const timer = window.setInterval(announce, 500);
    return () => window.clearInterval(timer);
  }, [connected, player, transportReady]);

  useEffect(() => {
    const currentPlayer = playerRef.current;
    if (!code || !currentPlayer) return;
    const generation = ++connectionGenerationRef.current;
    if (!connectionPromiseRef.current) {
      connectionPromiseRef.current = connectSession(
        code,
        (message) => {
          if (message.type === "display-ready") {
            setConnected(true);
          }
          if (message.type === "blueprint") setGameJson(JSON.stringify(message.payload));
          if (message.type === "game-state") {
            setController({
              phase: message.phase,
              score: message.score,
              lives: message.lives,
              remainingSeconds: message.remainingSeconds,
              requiredGesture: message.requiredGesture,
              players: message.players,
            });
          }
          if (message.type === "result") {
            setResult(message.result);
            const blueprintRecord = parseStoredBlueprintRecord(
              readBrowserStorage("local", "move-canvas:active-blueprint-record"),
            );
            writeBrowserStorage(
              "local",
              "move-canvas:last-result",
              JSON.stringify({
                ...message.result,
                provenance: blueprintRecord
                  ? {
                      generator: blueprintRecord.provenance.generator,
                      model: blueprintRecord.provenance.model,
                      sourcePrompt: blueprintRecord.provenance.sourcePrompt,
                      generatedAt: blueprintRecord.provenance.generatedAt,
                      acceptedAt: blueprintRecord.acceptedAt,
                      validation: blueprintRecord.provenance.validation,
                      edits: blueprintRecord.edits,
                      calibrationVersion: calibrationRef.current?.version ?? null,
                    }
                  : null,
              }),
            );
          }
        },
        setTransportReady,
      );
    }
    const connectionPromise = connectionPromiseRef.current;
    void connectionPromise.then((connection) => {
      if (generation !== connectionGenerationRef.current) return;
      connectionRef.current = connection;
      setMode(connection.mode);
      void connection.send({ type: "controller-ready", player: currentPlayer });
      if (gameRef.current) void connection.send({ type: "blueprint", payload: gameRef.current });
    });
    return () => {
      const cleanupGeneration = generation;
      window.setTimeout(() => {
        // Strict Mode remounts immediately; only a genuine unmount keeps this generation current.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (connectionGenerationRef.current !== cleanupGeneration) return;
        void connectionPromise.then(async (connection) => {
          const leavingPlayer = playerRef.current;
          if (leavingPlayer)
            await connection.send({ type: "controller-left", playerId: leavingPlayer.id });
          await connection.close();
          if (connectionPromiseRef.current === connectionPromise)
            connectionPromiseRef.current = null;
        });
      }, 0);
    };
  }, [code, player?.id]);

  useEffect(
    () => () => {
      poseSessionRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function enableMotionController() {
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current || !calibrationRef.current) {
      setMotion("error");
      return;
    }
    setMotion("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      poseSessionRef.current = await startPoseSession(videoRef.current, (frame) => {
        if (!frame || !hasTrackableBody(frame.landmarks)) {
          setMotion("out-of-frame");
          return;
        }
        setMotion("tracking");
        const gesture = classifyPose(frame.landmarks, calibrationRef.current!);
        setDetectedGesture(gesture);
        if (!gesture) return;
        const now = performance.now();
        const last = lastPoseRef.current;
        if (gesture !== last.gesture || now - last.sentAt >= 650) {
          lastPoseRef.current = { gesture, sentAt: now };
          void sendGestureMessage(connectionRef.current, playerRef.current?.id, gesture, now);
        }
      });
    } catch {
      setMotion("error");
    }
  }

  function startRound() {
    setResult(null);
    void connectionRef.current?.send({ type: "start" });
  }

  function togglePause() {
    void connectionRef.current?.send({ type: controller.phase === "paused" ? "resume" : "pause" });
  }

  function updatePlayerName(name: string) {
    if (!player) return;
    const next = { ...player, name: name.slice(0, 18) };
    playerRef.current = next;
    setPlayer(next);
    writeBrowserStorage("local", "move-canvas:player", JSON.stringify(next));
    void connectionRef.current?.send({ type: "controller-ready", player: next });
  }

  const displayUrl = origin ? `${origin}/display/${code}` : "";
  const myScore = player
    ? (controller.players.find((entry) => entry.id === player.id)?.score ?? 0)
    : 0;

  if (!game)
    return (
      <main className="setup-empty" id="main">
        <p className="eyebrow">ROOM {code || "OPENING"}</p>
        <h1>
          {isJoining
            ? "Waiting for the host to share the game."
            : "Create and calibrate a game first."}
        </h1>
        {isJoining && player ? (
          <label className="player-name player-name-light">
            Playing as
            <input
              aria-label="Player name"
              value={player.name}
              maxLength={18}
              onChange={(event) => updatePlayerName(event.target.value)}
            />
          </label>
        ) : null}
        {!isJoining ? (
          <Link className="button button-primary" href="/#create">
            Create a game
          </Link>
        ) : null}
      </main>
    );

  return (
    <main className="pair-page" id="main">
      <header className="setup-header">
        <span className="brand">
          <span aria-hidden="true">M</span>Move Canvas
        </span>
        <p>Controller</p>
      </header>
      {!connected ? (
        <section className="pair-layout">
          <div className="pair-copy">
            <p className="eyebrow">PUT {game.title.toUpperCase()} ON THE BIG SCREEN</p>
            <h1>Pair your display.</h1>
            <p>Open this link on the TV browser. Keep this phone as the controller.</p>
            {player ? (
              <label className="player-name">
                Playing as
                <input
                  aria-label="Player name"
                  value={player.name}
                  maxLength={18}
                  onChange={(event) => updatePlayerName(event.target.value)}
                />
              </label>
            ) : null}
            <div className="room-code">
              <span>Room code</span>
              <strong>{code}</strong>
            </div>
            {displayUrl ? (
              <a
                className="button button-primary"
                href={displayUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open display
              </a>
            ) : null}
            <p className="transport-note">
              {mode === "supabase"
                ? "Cross-device relay ready"
                : "Local verification mode · production relay not configured"}
            </p>
          </div>
          <div className="qr-card">
            {displayUrl ? (
              <QRCodeSVG
                value={displayUrl}
                size={220}
                bgColor="#f5f0e7"
                fgColor="#171524"
                level="M"
              />
            ) : null}
            <p>{transportReady ? "Waiting for the display…" : "Opening the room…"}</p>
            <span className="connection-light" aria-hidden="true" />
          </div>
        </section>
      ) : (
        <section className="live-controller" aria-labelledby="controller-title">
          <div className="controller-camera">
            <video ref={videoRef} muted playsInline aria-label="Live motion-controller camera" />
            <div className="motion-status">
              <span
                className={
                  motion === "tracking" ? "connection-light connected" : "connection-light"
                }
              />
              {motionLabel(motion)}
            </div>
            {motion === "idle" || motion === "error" ? (
              <button
                className="button button-primary"
                type="button"
                onClick={enableMotionController}
              >
                {motion === "error" ? "Try camera again" : "Enable motion control"}
              </button>
            ) : null}
            {detectedGesture ? (
              <strong className="detected-pose">{formatGesture(detectedGesture)}</strong>
            ) : null}
          </div>
          <div className="controller-console">
            <p className="eyebrow">{game.title.toUpperCase()} · DISPLAY CONNECTED</p>
            <h1 id="controller-title">
              {result
                ? `${result.score} points`
                : controller.phase === "playing"
                  ? formatGesture(controller.requiredGesture ?? "freeze")
                  : controller.phase === "paused"
                    ? "Round paused"
                    : "Ready to move?"}
            </h1>
            <div className="controller-stats">
              <span>
                My score <strong>{myScore}</strong>
              </span>
              <span>
                Team <strong>{controller.score}</strong>
              </span>
              <span>
                Time <strong>{controller.remainingSeconds}</strong>
              </span>
            </div>
            {player ? (
              <div className="player-strip" aria-label="Players in room" role="list">
                {controller.players.map((entry) => (
                  <span
                    className={entry.id === player.id ? "current-player" : ""}
                    key={entry.id}
                    role="listitem"
                    style={{ "--player-color": entry.color } as React.CSSProperties}
                  >
                    {entry.name} <strong>{entry.score}</strong>
                  </span>
                ))}
              </div>
            ) : null}
            {controller.phase === "ready" || controller.phase === "finished" ? (
              <button
                className="button button-primary round-action"
                type="button"
                onClick={startRound}
              >
                {controller.phase === "finished" ? "Play again" : "Start round"}
              </button>
            ) : (
              <button
                className="button button-ink round-action"
                type="button"
                onClick={togglePause}
              >
                {controller.phase === "paused" ? "Resume round" : "Pause round"}
              </button>
            )}
            <details className="manual-controls">
              <summary>Keyboard and testing controls</summary>
              <div className="gesture-grid">
                {game.gestures.map((gesture) => (
                  <button
                    type="button"
                    key={gesture}
                    onClick={() =>
                      void sendGestureMessage(connectionRef.current, playerRef.current?.id, gesture)
                    }
                  >
                    {formatGesture(gesture)}
                  </button>
                ))}
              </div>
            </details>
            <p className="privacy-note">
              Camera frames stay on this phone. The display receives movement names, game state, and
              timing only.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

const formatGesture = (gesture: string) =>
  gesture
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const readRoomCode = () => {
  const joinedCode = new URLSearchParams(window.location.search)
    .get("code")
    ?.toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 12);
  if (joinedCode?.length === 12) return joinedCode;
  const existing = readBrowserStorage("session", "move-canvas:room-code");
  if (existing) return existing;
  const code = createRoomCode();
  writeBrowserStorage("session", "move-canvas:room-code", code);
  return code;
};

const readPlayer = (): Player => {
  const saved = readBrowserStorage("local", "move-canvas:player");
  if (saved) {
    try {
      const parsed = playerSchema.safeParse(JSON.parse(saved));
      if (parsed.success) return parsed.data;
      removeBrowserStorage("local", "move-canvas:player");
    } catch {
      removeBrowserStorage("local", "move-canvas:player");
    }
  }
  const player = createPlayer();
  writeBrowserStorage("local", "move-canvas:player", JSON.stringify(player));
  return player;
};

const sendGestureMessage = async (
  connection: SessionConnection | null,
  playerId: string | undefined,
  gesture: Gesture,
  sentAt = performance.now(),
) => {
  if (!playerId) return;
  await connection?.send({ type: "gesture", playerId, gesture, sentAt });
};

const motionLabel = (state: MotionState) =>
  ({
    idle: "Motion control is off",
    requesting: "Starting camera and pose model…",
    tracking: "Body in frame",
    "out-of-frame": "Step back into frame",
    error: "Camera or pose model unavailable",
  })[state];
