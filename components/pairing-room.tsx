"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { GameBlueprint, Gesture } from "@/lib/blueprint";
import { connectSession, createRoomCode, type GameResult, type SessionConnection } from "@/lib/channel";
import type { GamePhase } from "@/lib/engine";
import { classifyPose, hasTrackableBody, type CalibrationProfile } from "@/lib/pose";
import { startPoseSession, type PoseSession } from "@/lib/pose-landmarker";

type ControllerState = {
  phase: GamePhase;
  score: number;
  lives: number;
  remainingSeconds: number;
  requiredGesture: Gesture | null;
};

type MotionState = "idle" | "requesting" | "tracking" | "out-of-frame" | "error";

const initialControllerState: ControllerState = {
  phase: "ready",
  score: 0,
  lives: 3,
  remainingSeconds: 0,
  requiredGesture: null,
};

export function PairingRoom() {
  const [code, setCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [gameJson, setGameJson] = useState<string | null>(null);
  const game = useMemo(() => gameJson ? (JSON.parse(gameJson) as GameBlueprint) : null, [gameJson]);
  const [connected, setConnected] = useState(false);
  const [transportReady, setTransportReady] = useState(false);
  const [mode, setMode] = useState<"supabase" | "same-device">("same-device");
  const [controller, setController] = useState(initialControllerState);
  const [result, setResult] = useState<GameResult | null>(null);
  const [motion, setMotion] = useState<MotionState>("idle");
  const [detectedGesture, setDetectedGesture] = useState<Gesture | null>(null);
  const connectionRef = useRef<SessionConnection | null>(null);
  const calibrationRef = useRef<CalibrationProfile | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseSessionRef = useRef<PoseSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPoseRef = useRef<{ gesture: Gesture | null; sentAt: number }>({ gesture: null, sentAt: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCode(readRoomCode());
      setOrigin(window.location.origin);
      setGameJson(localStorage.getItem("move-canvas:active-blueprint"));
      const profile = localStorage.getItem("move-canvas:calibration");
      calibrationRef.current = profile ? (JSON.parse(profile) as CalibrationProfile) : null;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!code) return;
    let active = true;
    void connectSession(
      code,
      (message) => {
        if (message.type === "display-ready") {
          setConnected(true);
          if (game) void connectionRef.current?.send({ type: "blueprint", payload: game });
        }
        if (message.type === "game-state") {
          setController({
            phase: message.phase,
            score: message.score,
            lives: message.lives,
            remainingSeconds: message.remainingSeconds,
            requiredGesture: message.requiredGesture,
          });
        }
        if (message.type === "result") {
          setResult(message.result);
          localStorage.setItem("move-canvas:last-result", JSON.stringify(message.result));
        }
      },
      setTransportReady,
    ).then((connection) => {
      if (!active) return void connection.close();
      connectionRef.current = connection;
      setMode(connection.mode);
      void connection.send({ type: "controller-ready" });
    });
    return () => {
      active = false;
      void connectionRef.current?.close();
    };
  }, [code, game]);

  useEffect(() => () => {
    poseSessionRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function enableMotionController() {
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current || !calibrationRef.current) {
      setMotion("error");
      return;
    }
    setMotion("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
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
          void sendGestureMessage(connectionRef.current, gesture, now);
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

  const displayUrl = origin ? `${origin}/display/${code}` : "";

  if (!game) return <main className="setup-empty"><h1>Create and calibrate a game first.</h1><Link className="button button-primary" href="/#create">Create a game</Link></main>;

  return (
    <main className="pair-page" id="main">
      <header className="setup-header"><span className="brand"><span aria-hidden="true">M</span>Move Canvas</span><p>Controller</p></header>
      {!connected ? (
        <section className="pair-layout">
          <div className="pair-copy">
            <p className="eyebrow">PUT {game.title.toUpperCase()} ON THE BIG SCREEN</p>
            <h1>Pair your display.</h1>
            <p>Open this link on the TV browser. Keep this phone as the controller.</p>
            <div className="room-code"><span>Room code</span><strong>{code}</strong></div>
            {displayUrl ? <a className="button button-primary" href={displayUrl} target="_blank" rel="noreferrer">Open display</a> : null}
            <p className="transport-note">{mode === "supabase" ? "Cross-device relay ready" : "Local verification mode · production relay not configured"}</p>
          </div>
          <div className="qr-card">
            {displayUrl ? <QRCodeSVG value={displayUrl} size={220} bgColor="#f5f0e7" fgColor="#171524" level="M" /> : null}
            <p>{transportReady ? "Waiting for the display…" : "Opening the room…"}</p>
            <span className="connection-light" aria-hidden="true" />
          </div>
        </section>
      ) : (
        <section className="live-controller" aria-labelledby="controller-title">
          <div className="controller-camera">
            <video ref={videoRef} muted playsInline aria-label="Live motion-controller camera" />
            <div className="motion-status"><span className={motion === "tracking" ? "connection-light connected" : "connection-light"} />{motionLabel(motion)}</div>
            {motion === "idle" || motion === "error" ? <button className="button button-primary" type="button" onClick={enableMotionController}>{motion === "error" ? "Try camera again" : "Enable motion control"}</button> : null}
            {detectedGesture ? <strong className="detected-pose">{formatGesture(detectedGesture)}</strong> : null}
          </div>
          <div className="controller-console">
            <p className="eyebrow">{game.title.toUpperCase()} · DISPLAY CONNECTED</p>
            <h1 id="controller-title">{result ? `${result.score} points` : controller.phase === "playing" ? formatGesture(controller.requiredGesture ?? "freeze") : controller.phase === "paused" ? "Round paused" : "Ready to move?"}</h1>
            <div className="controller-stats"><span>Score <strong>{controller.score}</strong></span><span>Time <strong>{controller.remainingSeconds}</strong></span><span>Lives <strong>{controller.lives}</strong></span></div>
            {controller.phase === "ready" || controller.phase === "finished" ? <button className="button button-primary round-action" type="button" onClick={startRound}>{controller.phase === "finished" ? "Play again" : "Start round"}</button> : <button className="button button-ink round-action" type="button" onClick={togglePause}>{controller.phase === "paused" ? "Resume round" : "Pause round"}</button>}
            <details className="manual-controls">
              <summary>Keyboard and testing controls</summary>
              <div className="gesture-grid">
                {game.gestures.map((gesture) => <button type="button" key={gesture} onClick={() => void sendGestureMessage(connectionRef.current, gesture)}>{formatGesture(gesture)}</button>)}
              </div>
            </details>
            <p className="privacy-note">Camera frames stay on this phone. The display receives movement names, game state, and timing only.</p>
          </div>
        </section>
      )}
    </main>
  );
}

const formatGesture = (gesture: string) => gesture.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

const readRoomCode = () => {
  const existing = sessionStorage.getItem("move-canvas:room-code");
  if (existing) return existing;
  const code = createRoomCode();
  sessionStorage.setItem("move-canvas:room-code", code);
  return code;
};

const sendGestureMessage = async (connection: SessionConnection | null, gesture: Gesture, sentAt = performance.now()) => {
  await connection?.send({ type: "gesture", gesture, sentAt });
};

const motionLabel = (state: MotionState) => ({
  idle: "Motion control is off",
  requesting: "Starting camera and pose model…",
  tracking: "Body in frame",
  "out-of-frame": "Step back into frame",
  error: "Camera or pose model unavailable",
})[state];
