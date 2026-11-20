"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { connectSession, createRoomCode, type SessionConnection } from "@/lib/channel";
import { readBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage";
import {
  DANCE_LIMITATION,
  TENNIS_LIMITATION,
  coachSessionSchema,
  danceTimelineSchema,
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
import {
  applyCoachControl,
  coachElapsed,
  createClockSyncControl,
  createCoachClock,
  createCoachControl,
  syncReferenceMedia,
  type CoachControl,
  type CoachControlAction,
} from "@/lib/coach-clock";
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
  const clockRef = useRef(createCoachClock());
  const handledControlsRef = useRef(new Set<string>());
  const countdownTimerRef = useRef<number | null>(null);
  const applyControlRef = useRef<(control: CoachControl) => void>(() => undefined);
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
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [clock, setClock] = useState(createCoachClock);
  const [clockNow, setClockNow] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storageKey = `move-canvas:${mode}:room-code`;
      const room = readBrowserStorage("session", storageKey) ?? createRoomCode();
      writeBrowserStorage("session", storageKey, room);
      setCode(room);
      setOrigin(window.location.origin);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const currentSession = useMemo<CoachSession | null>(
    () =>
      code
        ? {
            id: `${mode}-${code}`,
            roomCode: code,
            mode,
            createdAt: new Date().toISOString(),
            status: running ? "running" : "ready",
            ...(mode === "dance-coach" ? { clipLabel } : { drill, handedness }),
          }
        : null,
    [clipLabel, code, drill, handedness, mode, running],
  );

  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    if (!code) return;
    let active = true;
    void connectSession(
      code,
      (message) => {
        if (message.type === "coach-controller-ready" && message.mode === mode) {
          setConnected(true);
          if (currentSessionRef.current)
            void connectionRef.current?.send({
              type: "coach-session",
              session: currentSessionRef.current,
            });
          if (mode === "dance-coach" && timelineRef.current)
            void connectionRef.current?.send({
              type: "dance-reference",
              timeline: timelineRef.current,
            });
          const sync = createClockSyncControl(clockRef.current, performance.now());
          if (sync) void connectionRef.current?.send({ type: "coach-control", ...sync });
        }
        if (message.type === "coach-session") {
          const parsed = coachSessionSchema.safeParse(message.session);
          if (parsed.success && parsed.data.mode === mode) {
            setConnected(true);
            if (mode === "dance-coach" && parsed.data.clipLabel)
              setClipLabel(parsed.data.clipLabel);
            if (mode === "tennis-coach") {
              if (parsed.data.drill) setDrill(parsed.data.drill);
              if (parsed.data.handedness) setHandedness(parsed.data.handedness);
            }
          }
        }
        if (message.type === "dance-reference" && mode === "dance-coach") {
          const parsed = danceTimelineSchema.safeParse(message.timeline);
          if (parsed.success) {
            setTimeline(parsed.data);
            setExtraction("ready");
            setRecoveryNotice(
              "Reference timeline restored from the paired phone. Reselect the local clip to restore its video preview after display reload.",
            );
          }
        }
        if (message.type === "dance-feedback")
          setDanceEvents((events) => [...events.slice(-39), message.event]);
        if (message.type === "tennis-progress") {
          setPhase(message.phase);
          setRepCount(message.repCount);
        }
        if (message.type === "coach-result") {
          setResult(message.result);
          setRunning(false);
        }
        if (message.type === "coach-control") {
          applyControlRef.current(message);
        }
      },
      setConnected,
    ).then((connection) => {
      if (!active) return void connection.close();
      connectionRef.current = connection;
      setTransport(connection.mode);
      void connection.send({ type: "coach-display-ready", mode });
    });
    return () => {
      active = false;
      referenceDisposeRef.current?.();
      referenceDisposeRef.current = null;
      if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
      void connectionRef.current?.close();
      connectionRef.current = null;
    };
  }, [code, mode]);

  useEffect(() => {
    if (clock.phase !== "running" && clock.phase !== "countdown") return;
    const timer = window.setInterval(() => setClockNow(performance.now()), 100);
    return () => window.clearInterval(timer);
  }, [clock.phase]);

  function applyControlMessage(control: CoachControl) {
    if (handledControlsRef.current.has(control.id)) return;
    handledControlsRef.current.add(control.id);
    if (control.action === "cancel-countdown" && countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    const next = applyCoachControl(clockRef.current, control, performance.now());
    if (next === clockRef.current) return;
    clockRef.current = next;
    setClock(next);
    setClockNow(performance.now());
    setRunning(next.phase === "running");
    if (mode === "dance-coach" && videoRef.current) syncReferenceMedia(videoRef.current, control);
  }
  useEffect(() => {
    applyControlRef.current = applyControlMessage;
  });

  async function chooseReference(file: File | undefined) {
    if (!file || !videoRef.current) return;
    setError("");
    setExtraction("loading");
    setProgress(0);
    setTimeline(null);
    setRecoveryNotice("");
    setResult(null);
    referenceDisposeRef.current?.();
    referenceDisposeRef.current = null;
    let loaded: Awaited<ReturnType<typeof loadReferenceVideo>> | null = null;
    try {
      loaded = await loadReferenceVideo(file, videoRef.current);
      const extracted = await extractReferenceTimeline(
        videoRef.current,
        loaded.durationMs,
        orientation,
        setProgress,
      );
      videoRef.current.currentTime = 0;
      referenceDisposeRef.current = loaded.dispose;
      setTimeline(extracted);
      setClipLabel(file.name);
      setExtraction("ready");
      if (connected)
        await connectionRef.current?.send({ type: "dance-reference", timeline: extracted });
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
    setRecoveryNotice("");
    if (connected) void connectionRef.current?.send({ type: "dance-reference", timeline: fixture });
  }

  async function control(action: CoachControlAction) {
    if (!currentSession) return;
    const controlMessage = createCoachControl(
      action,
      "display",
      clockRef.current,
      performance.now(),
      action === "countdown" ? 3_000 : undefined,
    );
    if (action === "start") {
      setResult(null);
      setDanceEvents([]);
      setRepCount(0);
      await connectionRef.current?.send({
        type: "coach-session",
        session: { ...currentSession, status: "running" },
      });
      if (timeline) await connectionRef.current?.send({ type: "dance-reference", timeline });
    }
    applyControlMessage(controlMessage);
    await connectionRef.current?.send({ type: "coach-control", ...controlMessage });
  }

  function startPractice() {
    if (mode === "dance-coach") return void control("start");
    void control("countdown");
    if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = window.setTimeout(() => {
      countdownTimerRef.current = null;
      void control("start");
    }, 3_000);
  }

  function cancelCountdown() {
    if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = null;
    void control("cancel-countdown");
  }

  const canStart = connected && (mode === "tennis-coach" || extraction === "ready");
  const controllerUrl =
    origin && code ? `${origin}/coach/controller?mode=${mode}&code=${code}` : "";
  const recentDance = danceEvents.at(-1);
  const elapsedMs = coachElapsed(clock, clockNow);
  const countdown =
    clock.phase === "countdown"
      ? Math.max(1, Math.ceil(((clock.countdownEndsAt ?? clockNow) - clockNow) / 1_000))
      : null;

  return (
    <main className={`coach-page coach-${mode}`} id="main">
      <nav className="nav coach-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">
          <span aria-hidden="true">M</span>Move Canvas
        </Link>
        <Link className="nav-link" href="/coach">
          All modes
        </Link>
      </nav>

      <section className="coach-hero" aria-labelledby="coach-title">
        <div>
          <p className="eyebrow">
            {mode === "dance-coach"
              ? "DANCE COACH · REFERENCE-RELATIVE"
              : "TENNIS COACH · SHADOW PRACTICE"}
          </p>
          <h1 id="coach-title">
            {mode === "dance-coach"
              ? "Practice beside a reference."
              : "Make each shadow phase visible."}
          </h1>
          <p>{mode === "dance-coach" ? DANCE_LIMITATION : TENNIS_LIMITATION}</p>
        </div>
        <div className="coach-room" aria-label={`Room ${code}`}>
          <span>ROOM</span>
          <strong>{code || "OPENING"}</strong>
          <span className={connected ? "status-pill status-ready" : "status-pill"}>
            {connected ? "Phone connected" : "Waiting for phone"}
          </span>
        </div>
      </section>

      <section className="coach-grid">
        <div className="coach-panel coach-setup">
          <p className="eyebrow">1 · PREPARE ON THIS DISPLAY</p>
          {mode === "dance-coach" ? (
            <>
              <label>
                Lead orientation
                <select
                  value={orientation}
                  onChange={(event) => setOrientation(event.target.value as DanceOrientation)}
                >
                  <option value="lead-left">Lead left</option>
                  <option value="lead-right">Lead right</option>
                  <option value="mirror">Mirror reference</option>
                </select>
              </label>
              <label>
                Local reference clip
                <input
                  aria-describedby="reference-help"
                  type="file"
                  accept="video/mp4,video/webm,.mp4,.webm"
                  onChange={(event) => void chooseReference(event.target.files?.[0])}
                />
              </label>
              <p id="reference-help" className="field-help">
                MP4 or WebM, 10–90 seconds. The file stays in this browser and is discarded after
                local extraction.
              </p>
              <video
                ref={videoRef}
                className="reference-video"
                controls
                playsInline
                onEnded={() => void control("stop")}
              />
              <div className="coach-status" role="status" aria-live="polite">
                {extraction === "empty"
                  ? "Choose a reference to begin local pose extraction."
                  : null}
                {extraction === "loading"
                  ? `Extracting estimated 2D poses locally… ${Math.round(progress * 100)}%`
                  : null}
                {extraction === "ready" && timeline
                  ? `${timeline.frames.length} confidence-qualified samples · ${Math.round(serializedBytes(timeline) / 1024)} KiB timeline`
                  : null}
                {extraction === "error" ? (
                  <span role="alert">{error} Choose a different local clip and try again.</span>
                ) : null}
                {recoveryNotice ? <span>{recoveryNotice}</span> : null}
              </div>
              <div className="safety-card">
                <strong>Comfort-and-space check</strong>
                <p>
                  Choose a reference with movements that fit your comfortable range and clear space.
                  Stop instead of copying any movement that feels unsafe or unclear.
                </p>
              </div>
              <details className="verification-controls">
                <summary>Deterministic verification controls</summary>
                <p>
                  This synthetic landmark timeline tests UI and transport only. It is not real-clip
                  or real-device evidence.
                </p>
                <button type="button" onClick={loadVerificationTimeline}>
                  Load landmark fixture
                </button>
              </details>
            </>
          ) : (
            <>
              <label>
                Handedness
                <select
                  value={handedness}
                  onChange={(event) => setHandedness(event.target.value as Handedness)}
                >
                  <option value="right">Right-handed</option>
                  <option value="left">Left-handed</option>
                </select>
              </label>
              <fieldset>
                <legend>Shadow drill</legend>
                <label className="choice">
                  <input
                    type="radio"
                    name="drill"
                    checked={drill === "shadow-serve"}
                    onChange={() => setDrill("shadow-serve")}
                  />{" "}
                  Shadow Serve
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="drill"
                    checked={drill === "shadow-forehand"}
                    onChange={() => setDrill("shadow-forehand")}
                  />{" "}
                  Shadow Forehand
                </label>
              </fieldset>
              <div className="safety-card">
                <strong>Clear-space check</strong>
                <p>
                  Practice without a ball or racket. Keep a clear arm-span around you and stop if
                  the space no longer feels clear.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="coach-panel coach-pair">
          <p className="eyebrow">2 · PAIR THE PHONE CAMERA</p>
          {controllerUrl ? (
            <QRCodeSVG
              value={controllerUrl}
              size={190}
              bgColor="#f5f0e7"
              fgColor="#171524"
              level="M"
              title="Open this coaching room on a phone"
            />
          ) : null}
          <p>
            Scan or open the controller URL. Camera frames and raw user landmarks stay on the phone.
          </p>
          {controllerUrl ? (
            <a className="button button-ink" href={controllerUrl} target="_blank" rel="noreferrer">
              Open phone controller
            </a>
          ) : null}
          <small>
            {transport === "supabase"
              ? "Private possession-code relay"
              : "Same-device verification relay"}
          </small>
        </div>
      </section>

      <section className="coach-run" aria-labelledby="run-title">
        <p className="eyebrow">3 · PRACTICE</p>
        <h2 id="run-title">
          {result
            ? "Session complete"
            : countdown
              ? `Starting in ${countdown}`
              : running
                ? mode === "dance-coach"
                  ? (recentDance?.cue ?? "Follow the selected reference.")
                  : phase
                    ? phase.replaceAll("-", " ")
                    : "Move through the named phases."
                : "Start when the phone is framed and ready."}
        </h2>
        <p className="coach-clock" data-testid="coach-elapsed">
          Elapsed {(elapsedMs / 1_000).toFixed(1)}s
        </p>
        {mode === "tennis-coach" && countdown ? (
          <p role="status" aria-live="assertive" aria-atomic="true">
            Tennis practice starts in {countdown}
          </p>
        ) : null}
        {mode === "tennis-coach" ? (
          <p className="rep-count">
            Qualified reps <strong>{repCount} / 3</strong>
          </p>
        ) : null}
        {mode === "dance-coach" ? (
          <p data-testid="dance-comparison-offset">
            Comparison offset {recentDance?.offsetMs ?? "—"} ms
          </p>
        ) : null}
        <div className="coach-actions">
          {clock.phase === "countdown" ? (
            <button className="button button-ghost" type="button" onClick={cancelCountdown}>
              Cancel countdown
            </button>
          ) : null}
          {clock.phase !== "running" && clock.phase !== "paused" && clock.phase !== "countdown" ? (
            <button
              className="button button-primary"
              type="button"
              disabled={!canStart}
              onClick={startPractice}
            >
              {result ? "Practice again" : "Start practice"}
            </button>
          ) : null}
          {running ? (
            <button
              className="button button-ink"
              type="button"
              onClick={() => void control("pause")}
            >
              Pause
            </button>
          ) : null}
          {clock.phase === "running" || clock.phase === "paused" ? (
            <button
              className="button button-ghost"
              type="button"
              onClick={() => void control("stop")}
            >
              End session
            </button>
          ) : null}
          {clock.phase === "paused" && connected ? (
            <button
              className="button button-primary"
              type="button"
              onClick={() => void control("resume")}
            >
              Resume
            </button>
          ) : null}
        </div>
        {result ? (
          <div className="coach-result" aria-live="polite">
            <p>
              Confidence {Math.round(result.confidence * 100)}% · {result.completedUnits} qualified{" "}
              {mode === "dance-coach" ? "comparisons" : "reps"}
            </p>
            <ul>
              {result.cues.map((cue) => (
                <li key={cue.code}>{cue.text}</li>
              ))}
            </ul>
            <p className="limitation">{result.limitation}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
