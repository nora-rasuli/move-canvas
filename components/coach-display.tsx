"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { connectSession, createRoomCode, type SessionConnection } from "@/lib/channel";
import {
  DANCE_LIMITATION,
  TENNIS_LIMITATION,
  serializedBytes,
  type CoachResult,
  type CoachSession,
  type DanceFeedbackEvent,
  type DanceTimeline,
  type Handedness,
  type TennisDrill,
  type TennisPhase,
} from "@/lib/coach";
import { createVerificationDanceTimeline } from "@/lib/coach-fixtures";
import { loadReferenceVideo, extractReferenceTimeline } from "@/lib/reference-extractor";
import type { DanceOrientation } from "@/lib/dance";

type CoachMode = "dance-coach" | "tennis-coach";
type ExtractionState = "empty" | "loading" | "ready" | "error";

export function CoachDisplay({ mode }: { mode: CoachMode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const referenceDisposeRef = useRef<(() => void) | null>(null);
  const connectionRef = useRef<SessionConnection | null>(null);
  const currentSessionRef = useRef<CoachSession | null>(null);
  const timelineRef = useRef<DanceTimeline | null>(null);
  const [code, setCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<"supabase" | "same-device">("same-device");
  const [timeline, setTimeline] = useState<DanceTimeline | null>(null);
  const [clipLabel, setClipLabel] = useState("");
  const [orientation, setOrientation] = useState<DanceOrientation>("lead-left");
  const [extraction, setExtraction] = useState<ExtractionState>("empty");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [drill, setDrill] = useState<TennisDrill>("shadow-serve");
  const [handedness, setHandedness] = useState<Handedness>("right");
  const [phase, setPhase] = useState<TennisPhase | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [danceEvents, setDanceEvents] = useState<DanceFeedbackEvent[]>([]);
  const [result, setResult] = useState<CoachResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storageKey = `move-canvas:${mode}:room-code`;
      const room = sessionStorage.getItem(storageKey) ?? createRoomCode();
      sessionStorage.setItem(storageKey, room);
      setCode(room);
      setOrigin(window.location.origin);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const currentSession = useMemo<CoachSession | null>(() => code ? ({
    id: `${mode}-${code}`,
    roomCode: code,
    mode,
    createdAt: new Date().toISOString(),
    status: running ? "running" : "ready",
    ...(mode === "dance-coach" ? { clipLabel } : { drill, handedness }),
  }) : null, [clipLabel, code, drill, handedness, mode, running]);

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    if (!code) return;
    let active = true;
    void connectSession(code, (message) => {
      if (message.type === "coach-controller-ready" && message.mode === mode) {
        setConnected(true);
        if (currentSessionRef.current) void connectionRef.current?.send({ type: "coach-session", session: currentSessionRef.current });
        if (mode === "dance-coach" && timelineRef.current) void connectionRef.current?.send({ type: "dance-reference", timeline: timelineRef.current });
      }
      if (message.type === "dance-feedback") setDanceEvents((events) => [...events.slice(-39), message.event]);
      if (message.type === "tennis-progress") {
        setPhase(message.phase);
        setRepCount(message.repCount);
      }
      if (message.type === "coach-result") {
        setResult(message.result);
        setRunning(false);
      }
      if (message.type === "coach-control") {
        if (message.action === "pause") setRunning(false);
        if (message.action === "resume" || message.action === "start") setRunning(true);
        if (message.action === "stop") setRunning(false);
      }
    }, setConnected).then((connection) => {
      if (!active) return void connection.close();
      connectionRef.current = connection;
      setTransport(connection.mode);
    });
    return () => {
      active = false;
      referenceDisposeRef.current?.();
      referenceDisposeRef.current = null;
      void connectionRef.current?.close();
      connectionRef.current = null;
    };
  }, [code, mode]);

  async function chooseReference(file: File | undefined) {
    if (!file || !videoRef.current) return;
    setError("");
    setExtraction("loading");
    setProgress(0);
    setTimeline(null);
    setResult(null);
    referenceDisposeRef.current?.();
    referenceDisposeRef.current = null;
    let loaded: Awaited<ReturnType<typeof loadReferenceVideo>> | null = null;
    try {
      loaded = await loadReferenceVideo(file, videoRef.current);
      const extracted = await extractReferenceTimeline(videoRef.current, loaded.durationMs, orientation, setProgress);
      videoRef.current.currentTime = 0;
      referenceDisposeRef.current = loaded.dispose;
      setTimeline(extracted);
      setClipLabel(file.name);
      setExtraction("ready");
      if (connected) await connectionRef.current?.send({ type: "dance-reference", timeline: extracted });
    } catch (caught) {
      loaded?.dispose();
      setExtraction("error");
      setError(caught instanceof Error ? caught.message : "The reference could not be analyzed.");
    }
  }

  function loadVerificationTimeline() {
    const fixture = createVerificationDanceTimeline();
    setTimeline(fixture);
    setClipLabel("Deterministic landmark fixture (not a real clip)");
    setExtraction("ready");
    setError("");
    if (connected) void connectionRef.current?.send({ type: "dance-reference", timeline: fixture });
  }

  async function control(action: "start" | "pause" | "resume" | "stop") {
    if (!currentSession) return;
    setRunning(action === "start" || action === "resume");
    if (action === "start") {
      setResult(null);
      setDanceEvents([]);
      setRepCount(0);
      await connectionRef.current?.send({ type: "coach-session", session: { ...currentSession, status: "running" } });
      if (timeline) await connectionRef.current?.send({ type: "dance-reference", timeline });
      if (mode === "dance-coach" && videoRef.current?.src) void videoRef.current.play();
    }
    if (action === "pause") videoRef.current?.pause();
    await connectionRef.current?.send({ type: "coach-control", action, sentAt: performance.now() });
  }

  const canStart = connected && (mode === "tennis-coach" || extraction === "ready");
  const controllerUrl = origin && code ? `${origin}/coach/controller?mode=${mode}&code=${code}` : "";
  const recentDance = danceEvents.at(-1);

  return (
    <main className={`coach-page coach-${mode}`} id="main">
      <nav className="nav coach-nav" aria-label="Primary navigation">
        <Link className="brand" href="/"><span aria-hidden="true">M</span>Move Canvas</Link>
        <Link className="nav-link" href="/coach">All modes</Link>
      </nav>

      <section className="coach-hero" aria-labelledby="coach-title">
        <div>
          <p className="eyebrow">{mode === "dance-coach" ? "DANCE COACH · REFERENCE-RELATIVE" : "TENNIS COACH · SHADOW PRACTICE"}</p>
          <h1 id="coach-title">{mode === "dance-coach" ? "Practice beside a reference." : "Make each shadow phase visible."}</h1>
          <p>{mode === "dance-coach" ? DANCE_LIMITATION : TENNIS_LIMITATION}</p>
        </div>
        <div className="coach-room" aria-label={`Room ${code}`}>
          <span>ROOM</span><strong>{code || "OPENING"}</strong>
          <span className={connected ? "status-pill status-ready" : "status-pill"}>{connected ? "Phone connected" : "Waiting for phone"}</span>
        </div>
      </section>

      <section className="coach-grid">
        <div className="coach-panel coach-setup">
          <p className="eyebrow">1 · PREPARE ON THIS DISPLAY</p>
          {mode === "dance-coach" ? (
            <>
              <label>Lead orientation
                <select value={orientation} onChange={(event) => setOrientation(event.target.value as DanceOrientation)}>
                  <option value="lead-left">Lead left</option><option value="lead-right">Lead right</option><option value="mirror">Mirror reference</option>
                </select>
              </label>
              <label>Local reference clip
                <input aria-describedby="reference-help" type="file" accept="video/mp4,video/webm,.mp4,.webm" onChange={(event) => void chooseReference(event.target.files?.[0])} />
              </label>
              <p id="reference-help" className="field-help">MP4 or WebM, 10–90 seconds. The file stays in this browser and is discarded after local extraction.</p>
              <video ref={videoRef} className="reference-video" controls playsInline onEnded={() => void control("stop")} />
              <div className="coach-status" role="status" aria-live="polite">
                {extraction === "empty" ? "Choose a reference to begin local pose extraction." : null}
                {extraction === "loading" ? `Extracting estimated 2D poses locally… ${Math.round(progress * 100)}%` : null}
                {extraction === "ready" && timeline ? `${timeline.frames.length} confidence-qualified samples · ${Math.round(serializedBytes(timeline) / 1024)} KiB timeline` : null}
                {extraction === "error" ? <span role="alert">{error} Choose a different local clip and try again.</span> : null}
              </div>
              <details className="verification-controls"><summary>Deterministic verification controls</summary><p>This synthetic landmark timeline tests UI and transport only. It is not real-clip or real-device evidence.</p><button type="button" onClick={loadVerificationTimeline}>Load landmark fixture</button></details>
            </>
          ) : (
            <>
              <label>Handedness<select value={handedness} onChange={(event) => setHandedness(event.target.value as Handedness)}><option value="right">Right-handed</option><option value="left">Left-handed</option></select></label>
              <fieldset><legend>Shadow drill</legend><label className="choice"><input type="radio" name="drill" checked={drill === "shadow-serve"} onChange={() => setDrill("shadow-serve")} /> Shadow Serve</label><label className="choice"><input type="radio" name="drill" checked={drill === "shadow-forehand"} onChange={() => setDrill("shadow-forehand")} /> Shadow Forehand</label></fieldset>
              <div className="safety-card"><strong>Clear-space check</strong><p>Practice without a ball or racket. Keep a clear arm-span around you and stop if the space no longer feels clear.</p></div>
            </>
          )}
        </div>

        <div className="coach-panel coach-pair">
          <p className="eyebrow">2 · PAIR THE PHONE CAMERA</p>
          {controllerUrl ? <QRCodeSVG value={controllerUrl} size={190} bgColor="#f5f0e7" fgColor="#171524" level="M" /> : null}
          <p>Scan or open the controller URL. Camera frames and raw user landmarks stay on the phone.</p>
          {controllerUrl ? <a className="button button-ink" href={controllerUrl} target="_blank" rel="noreferrer">Open phone controller</a> : null}
          <small>{transport === "supabase" ? "Private possession-code relay" : "Same-device verification relay"}</small>
        </div>
      </section>

      <section className="coach-run" aria-labelledby="run-title">
        <p className="eyebrow">3 · PRACTICE</p>
        <h2 id="run-title">{result ? "Session complete" : running ? (mode === "dance-coach" ? recentDance?.cue ?? "Follow the selected reference." : phase ? phase.replaceAll("-", " ") : "Move through the named phases.") : "Start when the phone is framed and ready."}</h2>
        {mode === "tennis-coach" ? <p className="rep-count">Qualified reps <strong>{repCount} / 3</strong></p> : null}
        <div className="coach-actions">
          {!running ? <button className="button button-primary" type="button" disabled={!canStart} onClick={() => void control(result ? "start" : "start")}>{result ? "Practice again" : "Start practice"}</button> : <button className="button button-ink" type="button" onClick={() => void control("pause")}>Pause</button>}
          {running ? <button className="button button-ghost" type="button" onClick={() => void control("stop")}>End session</button> : null}
          {!running && !result && connected ? <button className="button button-ghost" type="button" onClick={() => void control("resume")}>Resume</button> : null}
        </div>
        {result ? <div className="coach-result" aria-live="polite"><p>Confidence {Math.round(result.confidence * 100)}% · {result.completedUnits} qualified {mode === "dance-coach" ? "comparisons" : "reps"}</p><ul>{result.cues.map((cue) => <li key={cue.code}>{cue.text}</li>)}</ul><p className="limitation">{result.limitation}</p></div> : null}
      </section>
    </main>
  );
}
