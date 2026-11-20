"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  connectSession,
  createRoomCode,
  type CoachControllerStateMessage,
  type SessionConnection,
  type SessionMessage,
} from "@/lib/channel";
import { readBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage";
import {
  DANCE_LIMITATION,
  TENNIS_LIMITATION,
  coachSessionSchema,
  danceTimelineSchema,
  type CoachResult,
  type CoachSession,
  type DanceFeedbackEvent,
  type DanceTimeline,
  type Handedness,
  type MovementFocus,
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
import { evaluateCoachReadiness } from "@/lib/coach-readiness";
import { clipsForMode, type ReferenceClip } from "@/lib/reference-library";
import { youtubeEmbedUrl, youtubeSearchResponseSchema, type YouTubeResult } from "@/lib/youtube";

type CoachMode = "dance-coach" | "tennis-coach";
type ExtractionState = "empty" | "loading" | "ready" | "error";

export function CoachDisplay({
  mode,
  testHarness = false,
}: {
  mode: CoachMode;
  testHarness?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const referenceDisposeRef = useRef<(() => void) | null>(null);
  const connectionRef = useRef<SessionConnection | null>(null);
  const playerVideoRef = useRef<HTMLVideoElement>(null);
  const videoPeerRef = useRef<RTCPeerConnection | null>(null);
  const pendingVideoCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const currentSessionRef = useRef<CoachSession | null>(null);
  const timelineRef = useRef<DanceTimeline | null>(null);
  const clockRef = useRef(createCoachClock());
  const handledControlsRef = useRef(new Set<string>());
  const countdownTimerRef = useRef<number | null>(null);
  const applyControlRef = useRef<(control: CoachControl) => void>(() => undefined);
  const handlePhoneVideoSignalRef = useRef<
    (message: Extract<SessionMessage, { type: "coach-video-signal" }>) => Promise<void>
  >(async () => undefined);
  const controllerReadyRef = useRef(false);
  const [code, setCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [transportReady, setTransportReady] = useState(false);
  const [controllerState, setControllerState] = useState<CoachControllerStateMessage | null>(null);
  const [peerNow, setPeerNow] = useState(Date.now);
  const [transport, setTransport] = useState<"supabase" | "same-device">("same-device");
  const [timeline, setTimeline] = useState<DanceTimeline | null>(null);
  const [clipLabel, setClipLabel] = useState("");
  const [orientation, setOrientation] = useState<DanceOrientation>("lead-left");
  const [extraction, setExtraction] = useState<ExtractionState>("empty");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [drill, setDrill] = useState<TennisDrill>("shadow-serve");
  const [movementFocus, setMovementFocus] = useState<MovementFocus>("salsa");
  const [handedness, setHandedness] = useState<Handedness>("right");
  const [phase, setPhase] = useState<TennisPhase | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [danceEvents, setDanceEvents] = useState<DanceFeedbackEvent[]>([]);
  const [result, setResult] = useState<CoachResult | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [clock, setClock] = useState(createCoachClock);
  const running = clock.phase === "running";
  const [clockNow, setClockNow] = useState(0);
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([]);
  const [youtubeStatus, setYoutubeStatus] = useState<"idle" | "loading" | "error">("idle");
  const [youtubeError, setYoutubeError] = useState("");
  const [youtubeSelection, setYoutubeSelection] = useState<YouTubeResult | null>(null);
  const [playerVideoStatus, setPlayerVideoStatus] = useState<
    "waiting" | "connecting" | "live" | "error"
  >("waiting");

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
            clipLabel,
            ...(mode === "dance-coach" ? { movementFocus } : {}),
            ...(mode === "tennis-coach" ? { drill, handedness } : {}),
          }
        : null,
    [clipLabel, code, drill, handedness, mode, movementFocus, running],
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
        if (message.type === "coach-controller-state" && message.mode === mode) {
          setControllerState(message);
          setPeerNow(Date.now());
          controllerReadyRef.current = evaluateCoachReadiness({
            relayConnected: true,
            controller: message,
            expectedMode: mode,
            expectedSessionId: currentSessionRef.current?.id ?? null,
            referenceRequired: true,
            now: Date.now(),
          }).ready;
          if (currentSessionRef.current)
            void connectionRef.current?.send({
              type: "coach-session",
              session: currentSessionRef.current,
            });
          if (timelineRef.current)
            void connectionRef.current?.send({
              type: "dance-reference",
              timeline: timelineRef.current,
            });
          const sync = createClockSyncControl(clockRef.current, performance.now());
          if (sync) void connectionRef.current?.send({ type: "coach-control", ...sync });
        }
        if (message.type === "coach-controller-left" && message.mode === mode) {
          setControllerState(null);
          setPeerNow(Date.now());
          stopPlayerVideo();
        }
        if (
          message.type === "coach-video-signal" &&
          message.mode === mode &&
          message.from === "phone"
        )
          void handlePhoneVideoSignalRef.current(message);
        if (message.type === "coach-session") {
          const parsed = coachSessionSchema.safeParse(message.session);
          if (parsed.success && parsed.data.mode === mode) {
            if (mode === "dance-coach" && parsed.data.clipLabel)
              setClipLabel(parsed.data.clipLabel);
            if (mode === "dance-coach" && parsed.data.movementFocus)
              setMovementFocus(parsed.data.movementFocus);
            if (mode === "tennis-coach") {
              if (parsed.data.drill) setDrill(parsed.data.drill);
              if (parsed.data.handedness) setHandedness(parsed.data.handedness);
            }
          }
        }
        if (message.type === "dance-reference") {
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
        }
        if (message.type === "coach-control") {
          if (
            (message.action === "start" ||
              message.action === "countdown" ||
              message.action === "resume") &&
            !controllerReadyRef.current
          )
            return;
          applyControlRef.current(message);
        }
      },
      (ready) => {
        setTransportReady(ready);
        if (!ready) setControllerState(null);
      },
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
      videoPeerRef.current?.close();
      videoPeerRef.current = null;
      void connectionRef.current?.close();
      connectionRef.current = null;
    };
  }, [code, mode]);

  useEffect(() => {
    const timer = window.setInterval(() => setPeerNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (clock.phase !== "running" && clock.phase !== "countdown") return;
    const timer = window.setInterval(() => setClockNow(performance.now()), 100);
    return () => window.clearInterval(timer);
  }, [clock.phase]);

  function stopPlayerVideo() {
    videoPeerRef.current?.close();
    videoPeerRef.current = null;
    pendingVideoCandidatesRef.current = [];
    if (playerVideoRef.current) playerVideoRef.current.srcObject = null;
    setPlayerVideoStatus("waiting");
  }

  function createDisplayVideoPeer() {
    stopPlayerVideo();
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    videoPeerRef.current = peer;
    setPlayerVideoStatus("connecting");
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (playerVideoRef.current && stream) playerVideoRef.current.srcObject = stream;
    };
    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      void connectionRef.current?.send({
        type: "coach-video-signal",
        mode,
        from: "display",
        signal: {
          kind: "ice",
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        },
      });
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") setPlayerVideoStatus("live");
      if (["failed", "disconnected"].includes(peer.connectionState)) setPlayerVideoStatus("error");
    };
    return peer;
  }

  async function handlePhoneVideoSignal(
    message: Extract<SessionMessage, { type: "coach-video-signal" }>,
  ) {
    try {
      if (message.signal.kind === "offer") {
        if (!("RTCPeerConnection" in window)) {
          setPlayerVideoStatus("error");
          return;
        }
        const peer = createDisplayVideoPeer();
        await peer.setRemoteDescription({ type: "offer", sdp: message.signal.sdp });
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        if (!answer.sdp) throw new Error("Missing video answer");
        await connectionRef.current?.send({
          type: "coach-video-signal",
          mode,
          from: "display",
          signal: { kind: "answer", sdp: answer.sdp },
        });
        for (const candidate of pendingVideoCandidatesRef.current)
          await peer.addIceCandidate(candidate);
        pendingVideoCandidatesRef.current = [];
      }
      if (message.signal.kind === "ice") {
        const candidate = {
          candidate: message.signal.candidate,
          sdpMid: message.signal.sdpMid,
          sdpMLineIndex: message.signal.sdpMLineIndex,
        };
        const peer = videoPeerRef.current;
        if (peer?.remoteDescription) await peer.addIceCandidate(candidate);
        else pendingVideoCandidatesRef.current.push(candidate);
      }
    } catch {
      setPlayerVideoStatus("error");
    }
  }
  useEffect(() => {
    handlePhoneVideoSignalRef.current = handlePhoneVideoSignal;
  });

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
    if (videoRef.current) syncReferenceMedia(videoRef.current, control);
  }
  useEffect(() => {
    applyControlRef.current = applyControlMessage;
  });

  async function chooseReference(
    file: File | undefined,
    label = file?.name ?? "",
    rejectMultiplePeople = true,
  ) {
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
        rejectMultiplePeople,
      );
      videoRef.current.currentTime = 0;
      referenceDisposeRef.current = loaded.dispose;
      setTimeline(extracted);
      setClipLabel(label || file.name);
      setYoutubeSelection(null);
      setExtraction("ready");
      if (controllerState)
        await connectionRef.current?.send({ type: "dance-reference", timeline: extracted });
    } catch (caught) {
      loaded?.dispose();
      setExtraction("error");
      setError(caught instanceof Error ? caught.message : "The reference could not be analyzed.");
    }
  }

  async function chooseBuiltIn(clip: ReferenceClip) {
    setError("");
    try {
      const response = await fetch(clip.src);
      if (!response.ok) throw new Error("The built-in reference could not be loaded.");
      const blob = await response.blob();
      await chooseReference(
        new File([blob], `${clip.id}.mp4`, { type: "video/mp4" }),
        clip.label,
        false,
      );
    } catch (caught) {
      setExtraction("error");
      setError(caught instanceof Error ? caught.message : "The built-in clip could not be loaded.");
    }
  }

  async function searchYouTube(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setYoutubeStatus("loading");
    setYoutubeError("");
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`);
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? String(payload.error)
            : "YouTube search is unavailable.";
        throw new Error(message);
      }
      const parsed = youtubeSearchResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("YouTube returned an invalid search response.");
      setYoutubeResults(parsed.data.results);
      setYoutubeStatus("idle");
    } catch (caught) {
      setYoutubeStatus("error");
      setYoutubeError(caught instanceof Error ? caught.message : "YouTube search is unavailable.");
    }
  }

  function loadVerificationTimeline() {
    const fixture = createVerificationDanceTimeline();
    setTimeline(fixture);
    setClipLabel("Deterministic landmark fixture (not a real clip)");
    setExtraction("ready");
    setError("");
    setRecoveryNotice("");
    if (controllerState)
      void connectionRef.current?.send({ type: "dance-reference", timeline: fixture });
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
    if (!canStart) return;
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

  const readiness = evaluateCoachReadiness({
    relayConnected: transportReady,
    controller: controllerState,
    expectedMode: mode,
    expectedSessionId: currentSession?.id ?? null,
    referenceRequired: true,
    now: peerNow,
  });
  const canStart = readiness.ready && extraction === "ready";
  useEffect(() => {
    controllerReadyRef.current = readiness.ready;
  }, [readiness.ready]);
  useEffect(() => {
    if (readiness.ready) return;
    const phase = clockRef.current.phase;
    if (phase !== "running" && phase !== "countdown") return;
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    const action = phase === "countdown" ? "cancel-countdown" : "pause";
    const message = createCoachControl(
      action,
      "tracking-loss",
      clockRef.current,
      performance.now(),
    );
    applyControlRef.current(message);
    void connectionRef.current?.send({ type: "coach-control", ...message });
    setRecoveryNotice("Practice stopped safely because the calibrated phone is no longer ready.");
  }, [readiness.ready]);
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
              ? "DANCE COACH · COMPARE WITH A REFERENCE"
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
          <span className={readiness.ready ? "status-pill status-ready" : "status-pill"}>
            {readiness.status}
          </span>
        </div>
      </section>

      <section className="coach-grid">
        <div className="coach-panel coach-setup">
          <p className="eyebrow">1 · PREPARE ON THIS DISPLAY</p>
          <div className="reference-library" aria-labelledby="reference-library-title">
            <div>
              <h2 id="reference-library-title">What do you want to practice?</h2>
              <p>
                Built-in and uploaded clips are analyzed locally into a compact 2D pose timeline.
              </p>
            </div>
            {mode === "dance-coach" ? (
              <fieldset>
                <legend>Dance and movement style</legend>
                {[
                  ["salsa", "Salsa"],
                  ["hip-hop", "Hip-hop"],
                  ["contemporary", "Contemporary"],
                  ["yoga-mobility", "Yoga & mobility"],
                ].map(([value, label]) => (
                  <label className="choice" key={value}>
                    <input
                      type="radio"
                      name="movement-focus"
                      checked={movementFocus === value}
                      onChange={() => setMovementFocus(value as MovementFocus)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </fieldset>
            ) : null}
            <div className="reference-card-grid">
              {clipsForMode(mode).map((clip) => (
                <article className="reference-card" key={clip.id}>
                  <video
                    src={clip.src}
                    muted
                    playsInline
                    preload="metadata"
                    aria-label={clip.label}
                  />
                  <h3>{clip.label}</h3>
                  <p>{clip.description}</p>
                  <button
                    className="button button-ghost"
                    type="button"
                    disabled={extraction === "loading"}
                    onClick={() => void chooseBuiltIn(clip)}
                  >
                    Analyze this clip
                  </button>
                  <small>
                    <a href={clip.sourceUrl} target="_blank" rel="noreferrer">
                      Source
                    </a>{" "}
                    ·{" "}
                    <a href={clip.licenseUrl} target="_blank" rel="noreferrer">
                      Mixkit Free License
                    </a>
                  </small>
                </article>
              ))}
            </div>
          </div>
          <label>
            Upload your own reference clip
            <input
              aria-describedby="reference-help"
              type="file"
              accept="video/mp4,video/webm,.mp4,.webm"
              onChange={(event) => void chooseReference(event.target.files?.[0])}
            />
          </label>
          <p id="reference-help" className="field-help">
            MP4 or WebM, 10–90 seconds. The file and raw reference landmarks stay in this browser.
          </p>
          {mode === "dance-coach" ? (
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
                <legend>What do you want to practice?</legend>
                {[
                  ["shadow-forehand", "Forehand"],
                  ["shadow-backhand", "Backhand"],
                  ["shadow-serve", "Serve"],
                  ["shadow-volley", "Volley"],
                ].map(([value, label]) => (
                  <label className="choice" key={value}>
                    <input
                      type="radio"
                      name="drill"
                      checked={drill === value}
                      onChange={() => setDrill(value as TennisDrill)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </fieldset>
            </>
          )}
          <video
            ref={videoRef}
            className="reference-video"
            controls
            playsInline
            onEnded={() => void control("stop")}
          />
          <div className="coach-status" role="status" aria-live="polite">
            {extraction === "empty" ? "Choose a reference to begin local pose extraction." : null}
            {extraction === "loading"
              ? `Extracting estimated 2D poses locally… ${Math.round(progress * 100)}%`
              : null}
            {extraction === "ready" && timeline
              ? `${clipLabel} is ready · ${timeline.frames.length} clear reference frames analyzed on this display`
              : null}
            {extraction === "error" ? (
              <span role="alert">{error} Choose a different reference and try again.</span>
            ) : null}
            {recoveryNotice ? <span>{recoveryNotice}</span> : null}
          </div>

          <details className="youtube-reference">
            <summary>Find a visual reference on YouTube</summary>
            <form onSubmit={searchYouTube}>
              <label>
                Search YouTube
                <input
                  value={youtubeQuery}
                  minLength={2}
                  maxLength={80}
                  onChange={(event) => setYoutubeQuery(event.target.value)}
                  placeholder={
                    mode === "dance-coach"
                      ? `${movementFocus.replace("-", " ")} beginner routine`
                      : `${drill.replace("shadow-", "")} tennis practice`
                  }
                />
              </label>
              <button
                className="button button-ink"
                type="submit"
                disabled={youtubeStatus === "loading"}
              >
                {youtubeStatus === "loading" ? "Searching…" : "Search"}
              </button>
            </form>
            {youtubeError ? <p role="alert">{youtubeError}</p> : null}
            <div className="youtube-results">
              {youtubeResults.map((video) => (
                <button
                  type="button"
                  key={video.id}
                  onClick={() => setYoutubeSelection(video)}
                  aria-pressed={youtubeSelection?.id === video.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={video.thumbnail} alt="" width="240" height="135" />
                  <strong>{video.title}</strong>
                  <span>{video.channelTitle}</span>
                </button>
              ))}
            </div>
            {youtubeSelection ? (
              <iframe
                className="youtube-player"
                src={youtubeEmbedUrl(youtubeSelection.id)}
                title={`YouTube reference: ${youtubeSelection.title}`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}
            <p className="field-help">
              YouTube supports search and embedded playback. Its player does not expose video frames
              for pose extraction, so comparison scoring requires a built-in clip or a video file
              you own and upload here.
            </p>
          </details>

          <div className="safety-card">
            <strong>Comfort-and-space check</strong>
            <p>
              Choose movement that fits your comfortable range, clear an arm-span around you, and
              stop instead of copying anything unsafe or unclear.
            </p>
          </div>
          {testHarness ? (
            <details className="verification-controls">
              <summary>Deterministic verification controls</summary>
              <p>This test-only timeline never appears in production.</p>
              <button type="button" onClick={loadVerificationTimeline}>
                Load landmark fixture
              </button>
            </details>
          ) : null}
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
            Scan or open this room on a phone. Camera movement is processed on that phone. The TV
            receives only practice signals unless the player turns on Show me on TV.
          </p>
          {controllerUrl ? (
            <a className="button button-ink" href={controllerUrl} target="_blank" rel="noreferrer">
              Open phone controller
            </a>
          ) : null}
          <small>
            {transport === "supabase"
              ? "Private room connection"
              : "Same-device verification relay"}
          </small>
          <div className="player-live-view">
            <video
              ref={playerVideoRef}
              autoPlay
              muted
              playsInline
              aria-label="Live player camera from the paired phone"
            />
            <p aria-live="polite">
              {playerVideoStatus === "live"
                ? "Live player view · peer-to-peer · not recorded"
                : playerVideoStatus === "connecting"
                  ? "Connecting the private live player view…"
                  : playerVideoStatus === "error"
                    ? "Live player view unavailable. Practice can continue without it."
                    : "The player can choose Show me on TV from the phone."}
            </p>
          </div>
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
          {clock.phase === "paused" && readiness.ready ? (
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
