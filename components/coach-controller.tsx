"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { connectSession, type SessionConnection } from "@/lib/channel";
import { coachSessionSchema, danceTimelineSchema, type CoachSession, type DanceFeedbackEvent, type DanceTimeline, type TennisPhase } from "@/lib/coach";
import { verificationDanceEvents, verificationTennisPhases } from "@/lib/coach-fixtures";
import { compareDancePose, summarizeDanceEvents } from "@/lib/dance";
import { hasTrackableBody, type PoseFrame } from "@/lib/pose";
import { startPoseSession, type PoseSession } from "@/lib/pose-landmarker";
import { classifyTennisPhase, observeTennisPose, summarizeTennisReps, TennisRepTracker, type TennisRep } from "@/lib/tennis";

type CoachMode = "dance-coach" | "tennis-coach";
type CameraState = "idle" | "requesting" | "framing" | "ready" | "lost" | "error";

export function CoachController() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<PoseSession | null>(null);
  const connectionRef = useRef<SessionConnection | null>(null);
  const sessionRef = useRef<CoachSession | null>(null);
  const timelineRef = useRef<DanceTimeline | null>(null);
  const runningRef = useRef(false);
  const startedAtRef = useRef(0);
  const lastSentAtRef = useRef(0);
  const danceEventsRef = useRef<DanceFeedbackEvent[]>([]);
  const tennisRepsRef = useRef<TennisRep[]>([]);
  const trackerRef = useRef<TennisRepTracker | null>(null);
  const lastPhaseRef = useRef<TennisPhase | null>(null);
  const finishRunRef = useRef<() => void>(() => undefined);
  const calibratedRef = useRef(false);
  const framedRef = useRef(false);
  const [mode, setMode] = useState<CoachMode | null>(null);
  const [code, setCode] = useState("");
  const [session, setSession] = useState<CoachSession | null>(null);
  const [timeline, setTimeline] = useState<DanceTimeline | null>(null);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<"supabase" | "same-device">("same-device");
  const [camera, setCamera] = useState<CameraState>("idle");
  const [framed, setFramed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [running, setRunning] = useState(false);
  const [latestCue, setLatestCue] = useState("Waiting for the display setup.");
  const [repCount, setRepCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const nextMode = params.get("mode");
      const nextCode = params.get("code")?.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 12) ?? "";
      if ((nextMode === "dance-coach" || nextMode === "tennis-coach") && nextCode.length === 12) {
        setMode(nextMode);
        setCode(nextCode);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mode || !code) return;
    let active = true;
    void connectSession(code, (message) => {
      if (message.type === "coach-session") {
        const parsed = coachSessionSchema.safeParse(message.session);
        if (parsed.success && parsed.data.mode === mode) {
          sessionRef.current = parsed.data;
          setSession(parsed.data);
          if (parsed.data.mode === "tennis-coach" && parsed.data.drill) trackerRef.current = new TennisRepTracker(parsed.data.drill);
        }
      }
      if (message.type === "dance-reference") {
        const parsed = danceTimelineSchema.safeParse(message.timeline);
        if (parsed.success) {
          timelineRef.current = parsed.data;
          setTimeline(parsed.data);
          setLatestCue("Reference timeline received. Camera media remains on each originating device.");
        }
      }
      if (message.type === "coach-control") {
        if (message.action === "start") beginRun();
        if (message.action === "pause") pauseRun("Practice paused from the display.");
        if (message.action === "resume") resumeRun();
        if (message.action === "stop") finishRunRef.current();
      }
    }, setConnected).then((connection) => {
      if (!active) return void connection.close();
      connectionRef.current = connection;
      setTransport(connection.mode);
      void connection.send({ type: "coach-controller-ready", mode });
    });
    return () => {
      active = false;
      poseRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void connectionRef.current?.close();
      connectionRef.current = null;
    };
  }, [code, mode]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  useEffect(() => {
    calibratedRef.current = calibrated;
  }, [calibrated]);

  async function enableCamera() {
    if (!consent || !videoRef.current || !navigator.mediaDevices?.getUserMedia) {
      setCamera("error");
      setLatestCue("Camera access is unavailable or consent has not been confirmed.");
      return;
    }
    setCamera("requesting");
    try {
      poseRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      poseRef.current = await startPoseSession(videoRef.current, handlePoseFrame);
      setCamera("framing");
      setLatestCue("Bring your full body into view, then confirm framing.");
    } catch {
      setCamera("error");
      setLatestCue("Camera or pose model could not start. Check permission and retry.");
    }
  }

  function handlePoseFrame(frame: PoseFrame | null) {
    const bodyVisible = Boolean(frame && hasTrackableBody(frame.landmarks));
    if (framedRef.current !== bodyVisible) {
      framedRef.current = bodyVisible;
      setFramed(bodyVisible);
    }
    if (!bodyVisible) {
      if (runningRef.current) pauseRun("Tracking paused. Bring your full body back into view.");
      setCamera("lost");
      return;
    }
    setCamera(calibratedRef.current ? "ready" : "framing");
    if (!runningRef.current || !frame || performance.now() - lastSentAtRef.current < 180) return;
    lastSentAtRef.current = performance.now();
    if (mode === "dance-coach") handleDanceFrame(frame);
    if (mode === "tennis-coach") handleTennisFrame(frame);
  }

  function handleDanceFrame(frame: PoseFrame) {
    const activeTimeline = timelineRef.current;
    if (!activeTimeline) return;
    const event = compareDancePose(activeTimeline, frame.landmarks, performance.now() - startedAtRef.current);
    danceEventsRef.current.push(event);
    setLatestCue(event.cue);
    void connectionRef.current?.send({ type: "dance-feedback", event, sentAt: performance.now() });
  }

  function handleTennisFrame(frame: PoseFrame) {
    const activeSession = sessionRef.current;
    if (!activeSession?.drill || !activeSession.handedness || !trackerRef.current) return;
    const observation = observeTennisPose(frame.landmarks, activeSession.handedness);
    if (!observation) return;
    const phase = classifyTennisPhase(observation, activeSession.drill);
    if (phase === lastPhaseRef.current) return;
    lastPhaseRef.current = phase;
    const rep = trackerRef.current.ingest(phase, observation);
    if (rep) tennisRepsRef.current.push(rep);
    const count = tennisRepsRef.current.length;
    setRepCount(count);
    setLatestCue(phase ? `Visible phase: ${phase.replaceAll("-", " ")}` : "Phase unclear; this attempt remains unscored.");
    void connectionRef.current?.send({ type: "tennis-progress", phase, repCount: count, confidence: observation.confidence, sentAt: performance.now() });
    if (count >= 3) finishRun();
  }

  function confirmCalibration() {
    if (!framed) {
      setLatestCue("Calibration needs a clearly visible full body.");
      return;
    }
    setCalibrated(true);
    calibratedRef.current = true;
    setCamera("ready");
    setLatestCue("Framing and neutral range captured for this session.");
  }

  function beginRun() {
    danceEventsRef.current = [];
    tennisRepsRef.current = [];
    setRepCount(0);
    trackerRef.current = sessionRef.current?.drill ? new TennisRepTracker(sessionRef.current.drill) : null;
    startedAtRef.current = performance.now();
    setRunning(true);
    setLatestCue("Practice started. Low-confidence frames remain unscored.");
  }

  function pauseRun(cue = "Practice paused.") {
    setRunning(false);
    setLatestCue(cue);
    void connectionRef.current?.send({ type: "coach-control", action: "pause", sentAt: performance.now() });
  }

  function resumeRun() {
    startedAtRef.current = performance.now();
    setRunning(true);
    setLatestCue("Practice resumed.");
    void connectionRef.current?.send({ type: "coach-control", action: "resume", sentAt: performance.now() });
  }

  function finishRun() {
    setRunning(false);
    const result = mode === "dance-coach" ? summarizeDanceEvents(danceEventsRef.current) : summarizeTennisReps(tennisRepsRef.current);
    localStorage.setItem("move-canvas:last-coach-summary", JSON.stringify(result));
    setLatestCue("Session complete. Only this aggregate summary is saved locally.");
    void connectionRef.current?.send({ type: "coach-result", result });
  }
  useEffect(() => {
    finishRunRef.current = finishRun;
  });

  function useFixtureFraming() {
    setConsent(true);
    setFramed(true);
    framedRef.current = true;
    setCalibrated(true);
    calibratedRef.current = true;
    setCamera("ready");
    setLatestCue("Deterministic fixture framing ready. This is not real-camera evidence.");
  }

  function sendDanceFixture() {
    const next = verificationDanceEvents[danceEventsRef.current.length % verificationDanceEvents.length];
    danceEventsRef.current.push(next);
    setLatestCue(next.cue);
    void connectionRef.current?.send({ type: "dance-feedback", event: next, sentAt: performance.now() });
  }

  function sendTennisFixturePhase(phase: TennisPhase) {
    const activeSession = sessionRef.current;
    if (!activeSession?.drill) return;
    const phases = verificationTennisPhases(activeSession.drill);
    const expectedIndex = tennisRepsRef.current.length * phases.length + (Number(sessionStorage.getItem("move-canvas:fixture-phase")) || 0);
    const expected = phases[expectedIndex % phases.length];
    if (phase !== expected) {
      setLatestCue("Out-of-order fixture phase rejected; rep remains unscored.");
      return;
    }
    const nextIndex = (expectedIndex + 1) % phases.length;
    sessionStorage.setItem("move-canvas:fixture-phase", String(nextIndex));
    if (nextIndex === 0) {
      tennisRepsRef.current.push({ drill: activeSession.drill, phases, confidence: 0.9, issues: tennisRepsRef.current.length < 2 ? [activeSession.drill === "shadow-serve" ? "serve-trophy-height" : "forehand-turn-range"] : [] });
    }
    const count = tennisRepsRef.current.length;
    setRepCount(count);
    setLatestCue(`Visible fixture phase: ${phase.replaceAll("-", " ")}`);
    void connectionRef.current?.send({ type: "tennis-progress", phase, repCount: count, confidence: 0.9, sentAt: performance.now() });
    if (count >= 3) finishRun();
  }

  const ready = connected && session && calibrated && (mode === "tennis-coach" || timeline);
  const phases = useMemo(() => session?.drill ? verificationTennisPhases(session.drill) : [], [session?.drill]);

  if (!mode || !code) return <main className="setup-empty" id="main"><h1>Open a valid coaching room from the display.</h1><Link className="button button-primary" href="/coach">Choose a mode</Link></main>;

  return (
    <main className="controller-page coach-controller" id="main">
      <header className="controller-header"><Link className="brand brand-light" href="/coach"><span aria-hidden="true">M</span>Move Canvas</Link><span className={connected ? "status-pill status-ready" : "status-pill"}>{connected ? "Display connected" : "Reconnecting"}</span></header>
      <section className="controller-card" aria-labelledby="controller-title">
        <p className="eyebrow">{mode === "dance-coach" ? "DANCE COACH" : "TENNIS COACH"} · ROOM {code}</p>
        <h1 id="controller-title">Your camera stays on this phone.</h1>
        <p>The display receives only confidence-qualified semantic practice events{mode === "dance-coach" ? " and sends this phone a compact normalized reference timeline" : ""}.</p>
        <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I understand the camera is processed on this phone and can stop the session at any time.</label>
        <video ref={videoRef} className="controller-video" muted playsInline aria-label="Local camera preview" />
        <div className="coach-actions"><button className="button button-primary" type="button" disabled={!consent || camera === "requesting"} onClick={() => void enableCamera()}>{camera === "idle" || camera === "error" ? "Enable camera" : "Restart camera"}</button><button className="button button-ink" type="button" disabled={!framed} onClick={confirmCalibration}>Confirm framing & calibration</button></div>
        <p className="coach-status" aria-live="polite" role="status">{latestCue}</p>
        <dl className="controller-facts"><div><dt>Camera</dt><dd>{camera}</dd></div><div><dt>Reference/setup</dt><dd>{mode === "dance-coach" ? (timeline ? `${timeline.frames.length} samples` : "waiting") : (session?.drill?.replaceAll("-", " ") ?? "waiting")}</dd></div><div><dt>Qualified reps</dt><dd>{mode === "tennis-coach" ? `${repCount} / 3` : "—"}</dd></div></dl>
        <div className="coach-actions"><button className="button button-primary" type="button" disabled={!ready || running} onClick={beginRun}>Start on phone</button><button className="button button-ink" type="button" disabled={!running} onClick={() => pauseRun()}>Pause</button><button className="button button-ghost" type="button" disabled={!running} onClick={finishRun}>End safely</button></div>
        <details className="verification-controls"><summary>Deterministic verification controls</summary><p>These controls verify ordered rules, messaging, and recovery without claiming real-camera evidence.</p><button type="button" onClick={useFixtureFraming}>Use fixture framing</button>{mode === "dance-coach" ? <button type="button" disabled={!timeline} onClick={sendDanceFixture}>Send next fixture comparison</button> : phases.map((phase) => <button type="button" key={phase} onClick={() => sendTennisFixturePhase(phase)}>{phase.replaceAll("-", " ")}</button>)}</details>
        <p className="limitation">{mode === "dance-coach" ? "2D reference-relative practice cues only; no artistry or professional-coaching judgment." : "2D shadow-phase practice only; no ball, racket, force, speed, spin, placement, biomechanics, or injury guidance."}</p>
        <small>{transport === "supabase" ? "Private possession-code relay" : "Same-device verification relay"}</small>
      </section>
    </main>
  );
}
