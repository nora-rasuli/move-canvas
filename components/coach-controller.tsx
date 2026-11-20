"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  connectSession,
  type CoachControllerStateMessage,
  type SessionConnection,
  type SessionMessage,
} from "@/lib/channel";
import { readBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage";
import {
  calibrationStorageKey,
  captureCalibrationSample,
  createCalibrationRecord,
  FIXTURE_CALIBRATION_SAMPLES,
  parseCalibrationRecord,
  type CalibrationSample,
  type CoachCalibrationRecord,
} from "@/lib/calibration";
import {
  applyCoachControl,
  coachElapsed,
  createCoachClock,
  createCoachControl,
  createClockSyncControl,
  readCoachNow,
  type CoachControl,
  type CoachControlAction,
  type CoachControlOrigin,
} from "@/lib/coach-clock";
import {
  coachSessionSchema,
  danceTimelineSchema,
  type CoachResult,
  type CoachSession,
  type DanceFeedbackEvent,
  type DanceTimeline,
  type TennisPhase,
} from "@/lib/coach";
import { verificationDanceEvents, verificationTennisPhases } from "@/lib/coach-fixtures";
import { compareDancePose, summarizeDanceEvents } from "@/lib/dance";
import { hasTrackableBody, type PoseFrame } from "@/lib/pose";
import { startPoseSession, type PoseSession } from "@/lib/pose-landmarker";
import {
  classifyTennisPhase,
  observeTennisPose,
  summarizeTennisReps,
  TennisRepTracker,
  type TennisRep,
} from "@/lib/tennis";
import { CONTROLLER_HEARTBEAT_INTERVAL_MS } from "@/lib/coach-readiness";

type CoachMode = "dance-coach" | "tennis-coach";
type CameraState = "idle" | "requesting" | "framing" | "ready" | "lost" | "error";
type CalibrationCaptureStage = "neutral" | "range";

export function CoachController({ testHarness = false }: { testHarness?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fixtureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseRef = useRef<PoseSession | null>(null);
  const connectionRef = useRef<SessionConnection | null>(null);
  const videoPeerRef = useRef<RTCPeerConnection | null>(null);
  const pendingVideoCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const shareVideoRef = useRef(false);
  const sessionRef = useRef<CoachSession | null>(null);
  const timelineRef = useRef<DanceTimeline | null>(null);
  const runningRef = useRef(false);
  const clockRef = useRef(createCoachClock());
  const handledControlsRef = useRef(new Set<string>());
  const countdownTimerRef = useRef<number | null>(null);
  const calibrationCountdownRef = useRef<number | null>(null);
  const pendingCalibrationRef = useRef<{
    stage: CalibrationCaptureStage;
    captureAfter: number;
  } | null>(null);
  const applyControlRef = useRef<(control: CoachControl) => void>(() => undefined);
  const startVideoShareRef = useRef<() => Promise<void>>(async () => undefined);
  const handleDisplayVideoSignalRef = useRef<
    (message: Extract<SessionMessage, { type: "coach-video-signal" }>) => Promise<void>
  >(async () => undefined);
  const lastSentAtRef = useRef(0);
  const danceEventsRef = useRef<DanceFeedbackEvent[]>([]);
  const tennisRepsRef = useRef<TennisRep[]>([]);
  const trackerRef = useRef<TennisRepTracker | null>(null);
  const lastPhaseRef = useRef<TennisPhase | null>(null);
  const finishRunRef = useRef<() => void>(() => undefined);
  const calibrationRef = useRef<CoachCalibrationRecord | null>(null);
  const latestFrameRef = useRef<PoseFrame | null>(null);
  const framedRef = useRef(false);
  const controllerStateRef = useRef<CoachControllerStateMessage | null>(null);
  const readyRef = useRef(false);
  const [mode, setMode] = useState<CoachMode | null>(null);
  const [code, setCode] = useState("");
  const [session, setSession] = useState<CoachSession | null>(null);
  const [timeline, setTimeline] = useState<DanceTimeline | null>(null);
  const [connected, setConnected] = useState(false);
  const [displayPresent, setDisplayPresent] = useState(false);
  const [transport, setTransport] = useState<"supabase" | "same-device">("same-device");
  const [camera, setCamera] = useState<CameraState>("idle");
  const [framed, setFramed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [neutralSample, setNeutralSample] = useState<CalibrationSample | null>(null);
  const [calibration, setCalibration] = useState<CoachCalibrationRecord | null>(null);
  const [calibrationCapture, setCalibrationCapture] = useState<{
    stage: CalibrationCaptureStage;
    secondsRemaining: number;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [clock, setClock] = useState(createCoachClock);
  const [clockNow, setClockNow] = useState(0);
  const [latestCue, setLatestCue] = useState("Waiting for the display setup.");
  const [repCount, setRepCount] = useState(0);
  const [shareVideo, setShareVideo] = useState(false);
  const [videoShareStatus, setVideoShareStatus] = useState<"off" | "connecting" | "live" | "error">(
    "off",
  );

  const calibratedForSession = Boolean(session && calibration?.sessionId === session.id);
  const referenceReady = Boolean(timeline);
  const ready = Boolean(
    connected &&
      displayPresent &&
      session &&
      consent &&
      framed &&
      camera === "ready" &&
      calibratedForSession &&
      referenceReady,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const nextMode = params.get("mode");
      const nextCode =
        params
          .get("code")
          ?.toUpperCase()
          .replace(/[^0-9A-Z]/g, "")
          .slice(0, 12) ?? "";
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
    void connectSession(
      code,
      (message) => {
        if (message.type === "coach-session") {
          const parsed = coachSessionSchema.safeParse(message.session);
          if (parsed.success && parsed.data.mode === mode) {
            setDisplayPresent(true);
            sessionRef.current = parsed.data;
            setSession(parsed.data);
            const savedCalibration = parseCalibrationRecord(
              readBrowserStorage("session", calibrationStorageKey(parsed.data.id)),
              parsed.data.id,
            );
            calibrationRef.current = savedCalibration;
            setCalibration(savedCalibration);
            setNeutralSample(savedCalibration?.neutral ?? null);
            if (parsed.data.mode === "tennis-coach" && parsed.data.drill)
              trackerRef.current = new TennisRepTracker(parsed.data.drill);
          }
        }
        if (message.type === "coach-display-ready" && message.mode === mode) {
          setDisplayPresent(true);
          const state = controllerStateRef.current;
          const currentSession = sessionRef.current;
          const currentTimeline = timelineRef.current;
          const sync = createClockSyncControl(clockRef.current, readCoachNow(), "phone");
          void (async () => {
            if (state) await connectionRef.current?.send({ ...state, sentAt: Date.now() });
            if (currentSession)
              await connectionRef.current?.send({
                type: "coach-session",
                session: currentSession,
              });
            if (currentTimeline)
              await connectionRef.current?.send({
                type: "dance-reference",
                timeline: currentTimeline,
              });
            if (sync) await connectionRef.current?.send({ type: "coach-control", ...sync });
          })();
          if (shareVideoRef.current && streamRef.current) void startVideoShareRef.current();
        }
        if (
          message.type === "coach-video-signal" &&
          message.mode === mode &&
          message.from === "display"
        )
          void handleDisplayVideoSignalRef.current(message);
        if (message.type === "dance-reference") {
          const parsed = danceTimelineSchema.safeParse(message.timeline);
          if (parsed.success) {
            timelineRef.current = parsed.data;
            setTimeline(parsed.data);
            setLatestCue(
              "Reference timeline received. Camera media remains on each originating device.",
            );
          }
        }
        if (message.type === "coach-control") {
          if (
            (message.action === "start" ||
              message.action === "countdown" ||
              message.action === "resume") &&
            !readyRef.current
          ) {
            setLatestCue("Finish camera framing and session calibration before practice starts.");
            const state = controllerStateRef.current;
            if (state) void connectionRef.current?.send({ ...state, sentAt: Date.now() });
            return;
          }
          applyControlRef.current(message);
        }
      },
      (ready) => {
        setConnected(ready);
        if (!ready) setDisplayPresent(false);
      },
    ).then((connection) => {
      if (!active) return void connection.close();
      connectionRef.current = connection;
      setTransport(connection.mode);
      const state = controllerStateRef.current;
      if (state) void connection.send({ ...state, sentAt: Date.now() });
    });
    return () => {
      active = false;
      poseRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      videoPeerRef.current?.close();
      if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
      if (calibrationCountdownRef.current !== null)
        window.clearInterval(calibrationCountdownRef.current);
      void connectionRef.current?.close();
      connectionRef.current = null;
    };
  }, [code, mode]);

  useEffect(() => {
    if (!mode) return;
    const state: CoachControllerStateMessage = {
      type: "coach-controller-state",
      mode,
      sessionId: session?.id ?? null,
      camera,
      consent,
      framed,
      calibrated: calibratedForSession,
      referenceReady,
      sentAt: Date.now(),
    };
    controllerStateRef.current = state;
    readyRef.current = ready;
    if (!connected || !connectionRef.current) return;
    const announce = () => {
      const current = controllerStateRef.current;
      if (current) void connectionRef.current?.send({ ...current, sentAt: Date.now() });
    };
    announce();
    const timer = window.setInterval(announce, CONTROLLER_HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [
    calibratedForSession,
    camera,
    connected,
    consent,
    framed,
    mode,
    ready,
    referenceReady,
    session?.id,
  ]);

  useEffect(() => {
    if (!mode) return;
    const announceLeft = () => {
      void connectionRef.current?.send({
        type: "coach-controller-left",
        mode,
        sentAt: Date.now(),
      });
    };
    window.addEventListener("pagehide", announceLeft);
    return () => window.removeEventListener("pagehide", announceLeft);
  }, [mode]);

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
    shareVideoRef.current = shareVideo;
  }, [shareVideo]);
  useEffect(() => {
    if (clock.phase !== "running" && clock.phase !== "countdown") return;
    const timer = window.setInterval(() => setClockNow(performance.now()), 100);
    return () => window.clearInterval(timer);
  }, [clock.phase]);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      poseRef.current = await startPoseSession(videoRef.current, handlePoseFrame);
      setCamera("framing");
      setLatestCue("Bring your shoulders, hands, and hips into view, then confirm framing.");
      if (shareVideoRef.current) await startVideoShare();
    } catch {
      setCamera("error");
      setLatestCue("Camera or pose model could not start. Check permission and retry.");
    }
  }

  function stopVideoShare() {
    videoPeerRef.current?.close();
    videoPeerRef.current = null;
    pendingVideoCandidatesRef.current = [];
    setVideoShareStatus("off");
  }

  function createVideoPeer() {
    videoPeerRef.current?.close();
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    videoPeerRef.current = peer;
    pendingVideoCandidatesRef.current = [];
    peer.onicecandidate = (event) => {
      if (!event.candidate || !mode) return;
      void connectionRef.current?.send({
        type: "coach-video-signal",
        mode,
        from: "phone",
        signal: {
          kind: "ice",
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        },
      });
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") setVideoShareStatus("live");
      if (["failed", "disconnected", "closed"].includes(peer.connectionState))
        setVideoShareStatus(peer.connectionState === "closed" ? "off" : "error");
    };
    return peer;
  }

  async function startVideoShare() {
    const stream = streamRef.current;
    if (!stream || !mode || !("RTCPeerConnection" in window)) {
      setVideoShareStatus("error");
      setLatestCue(
        stream
          ? "This browser does not support the private TV live view."
          : "Enable the camera before sharing a live view with the TV.",
      );
      return;
    }
    setVideoShareStatus("connecting");
    try {
      const peer = createVideoPeer();
      for (const track of stream.getVideoTracks()) peer.addTrack(track, stream);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (!offer.sdp) throw new Error("Missing video offer");
      await connectionRef.current?.send({
        type: "coach-video-signal",
        mode,
        from: "phone",
        signal: { kind: "offer", sdp: offer.sdp },
      });
    } catch {
      stopVideoShare();
      setVideoShareStatus("error");
      setLatestCue("The private live view could not connect. Practice can continue on the phone.");
    }
  }
  useEffect(() => {
    startVideoShareRef.current = startVideoShare;
  });

  async function handleDisplayVideoSignal(
    message: Extract<SessionMessage, { type: "coach-video-signal" }>,
  ) {
    const peer = videoPeerRef.current;
    if (!peer) return;
    try {
      if (message.signal.kind === "answer") {
        await peer.setRemoteDescription({ type: "answer", sdp: message.signal.sdp });
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
        if (peer.remoteDescription) await peer.addIceCandidate(candidate);
        else pendingVideoCandidatesRef.current.push(candidate);
      }
    } catch {
      setVideoShareStatus("error");
      setLatestCue("The live TV view lost its secure peer connection. Retry sharing if wanted.");
    }
  }
  useEffect(() => {
    handleDisplayVideoSignalRef.current = handleDisplayVideoSignal;
  });

  function updateVideoSharing(enabled: boolean) {
    setShareVideo(enabled);
    shareVideoRef.current = enabled;
    if (enabled) void startVideoShare();
    else stopVideoShare();
  }

  function speakCalibrationCue(message: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
  }

  function clearPendingCalibration() {
    pendingCalibrationRef.current = null;
    if (calibrationCountdownRef.current !== null) {
      window.clearInterval(calibrationCountdownRef.current);
      calibrationCountdownRef.current = null;
    }
    setCalibrationCapture(null);
  }

  function armCalibrationCapture(stage: CalibrationCaptureStage) {
    if (!sessionRef.current) {
      setLatestCue("Wait for the display to finish creating the practice session.");
      return;
    }
    if (!streamRef.current || camera === "idle" || camera === "requesting" || camera === "error") {
      setLatestCue("Enable the camera before starting calibration.");
      return;
    }
    if (stage === "range" && !neutralSample) {
      setLatestCue("Capture the neutral stance before the comfortable range.");
      return;
    }
    if (pendingCalibrationRef.current?.stage === stage) {
      clearPendingCalibration();
      setLatestCue("Automatic capture canceled.");
      return;
    }

    clearPendingCalibration();
    const captureAfter = readCoachNow() + 5_000;
    pendingCalibrationRef.current = { stage, captureAfter };
    setCalibrationCapture({ stage, secondsRemaining: 5 });
    const setupCue =
      stage === "neutral"
        ? "Neutral capture armed. Step back, keep your shoulders, hands, and hips in frame, and sit or stand naturally."
        : "Range capture armed. Step back and hold a comfortable reach, turn, or knee bend.";
    setLatestCue(`${setupCue} Automatic capture starts in 5 seconds.`);
    speakCalibrationCue(`${setupCue} Capturing in five seconds.`);

    calibrationCountdownRef.current = window.setInterval(() => {
      const pending = pendingCalibrationRef.current;
      if (!pending) return;
      const secondsRemaining = Math.max(
        0,
        Math.ceil((pending.captureAfter - readCoachNow()) / 1_000),
      );
      setCalibrationCapture({ stage: pending.stage, secondsRemaining });
      if (secondsRemaining === 0 && calibrationCountdownRef.current !== null) {
        window.clearInterval(calibrationCountdownRef.current);
        calibrationCountdownRef.current = null;
        const holdCue =
          pending.stage === "neutral"
            ? "Hold your natural seated or standing position. Waiting for clear framing."
            : "Hold your comfortable range. Waiting for clear framing.";
        setLatestCue(holdCue);
        speakCalibrationCue(holdCue);
      }
    }, 200);
  }

  function handlePoseFrame(frame: PoseFrame | null) {
    latestFrameRef.current = frame;
    const bodyVisible = Boolean(frame && hasTrackableBody(frame.landmarks));
    if (framedRef.current !== bodyVisible) {
      framedRef.current = bodyVisible;
      setFramed(bodyVisible);
    }
    if (!bodyVisible) {
      if (runningRef.current) {
        setLatestCue("Tracking paused. Bring your shoulders, hands, and hips back into view.");
        void dispatchControl("pause", "tracking-loss");
      }
      setCamera("lost");
      return;
    }

    const pendingCalibration = pendingCalibrationRef.current;
    if (pendingCalibration && frame && readCoachNow() >= pendingCalibration.captureAfter) {
      const sample = captureCalibrationSample(frame.landmarks);
      if (sample) {
        if (pendingCalibration.stage === "neutral") completeNeutralCapture(sample);
        else completeRangeCapture(sample);
      }
    }
    setCamera(calibrationRef.current ? "ready" : "framing");
    const now = readCoachNow();
    if (!runningRef.current || !frame || now - lastSentAtRef.current < 180) return;
    lastSentAtRef.current = now;
    if (timelineRef.current) handleReferenceFrame(frame);
    if (mode === "tennis-coach") handleTennisFrame(frame);
  }

  function handleReferenceFrame(frame: PoseFrame) {
    const activeTimeline = timelineRef.current;
    if (!activeTimeline) return;
    const now = readCoachNow();
    const event = compareDancePose(
      activeTimeline,
      frame.landmarks,
      coachElapsed(clockRef.current, now),
      calibrationRef.current,
    );
    danceEventsRef.current.push(event);
    setLatestCue(event.cue);
    void connectionRef.current?.send({ type: "dance-feedback", event, sentAt: now });
  }

  function handleTennisFrame(frame: PoseFrame) {
    const activeSession = sessionRef.current;
    if (!activeSession?.drill || !activeSession.handedness || !trackerRef.current) return;
    const observation = observeTennisPose(frame.landmarks, activeSession.handedness);
    if (!observation) return;
    const phase = classifyTennisPhase(observation, activeSession.drill, calibrationRef.current);
    if (phase === lastPhaseRef.current) return;
    lastPhaseRef.current = phase;
    const rep = trackerRef.current.ingest(phase, observation);
    if (rep) tennisRepsRef.current.push(rep);
    const count = tennisRepsRef.current.length;
    setRepCount(count);
    setLatestCue(
      phase
        ? `Visible phase: ${phase.replaceAll("-", " ")}`
        : "Phase unclear; this attempt remains unscored.",
    );
    void connectionRef.current?.send({
      type: "tennis-progress",
      phase,
      repCount: count,
      confidence: observation.confidence,
      sentAt: readCoachNow(),
    });
    if (count >= 3) endRun();
  }

  function completeNeutralCapture(sample: CalibrationSample) {
    clearPendingCalibration();
    setNeutralSample(sample);
    setLatestCue(
      "Neutral stance captured automatically. Return to the phone and arm comfortable range.",
    );
    speakCalibrationCue("Neutral stance captured. Return to the phone and arm comfortable range.");
  }

  function completeRangeCapture(sample: CalibrationSample) {
    const activeSession = sessionRef.current;
    if (!activeSession || !neutralSample || !sample)
      return setLatestCue(
        "Range capture needs the neutral sample and clearly visible shoulders, hands, and hips.",
      );
    clearPendingCalibration();
    const record = createCalibrationRecord(activeSession.id, neutralSample, sample);
    const stored = writeBrowserStorage(
      "session",
      calibrationStorageKey(activeSession.id),
      JSON.stringify(record),
    );
    if (!stored) {
      setLatestCue(
        "Calibration was captured but session storage is unavailable. Keep this tab open or retry in a browser that allows local site data.",
      );
      return;
    }
    calibrationRef.current = record;
    setCalibration(record);
    setCamera("ready");
    setLatestCue(
      "Comfortable range captured automatically. The local calibration now adjusts supported thresholds.",
    );
    speakCalibrationCue("Comfortable range captured. Calibration is complete.");
  }

  function resetRun() {
    danceEventsRef.current = [];
    tennisRepsRef.current = [];
    setRepCount(0);
    trackerRef.current = sessionRef.current?.drill
      ? new TennisRepTracker(sessionRef.current.drill)
      : null;
    setLatestCue("Practice started. Low-confidence frames remain unscored.");
  }

  function applyControlMessage(control: CoachControl) {
    if (handledControlsRef.current.has(control.id)) return;
    handledControlsRef.current.add(control.id);
    if (control.action === "cancel-countdown" && countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    const now = readCoachNow();
    const previous = clockRef.current;
    const next = applyCoachControl(previous, control, now);
    if (next === previous) return;
    clockRef.current = next;
    setClock(next);
    setClockNow(now);
    setRunning(next.phase === "running");
    if (control.action === "start") resetRun();
    if (control.action === "pause" && control.origin !== "tracking-loss")
      setLatestCue("Practice paused.");
    if (control.action === "resume") setLatestCue("Practice resumed.");
    if (control.action === "stop") finishRunRef.current();
  }
  useEffect(() => {
    applyControlRef.current = applyControlMessage;
  });

  async function dispatchControl(action: CoachControlAction, origin: CoachControlOrigin = "phone") {
    const message = createCoachControl(
      action,
      origin,
      clockRef.current,
      readCoachNow(),
      action === "countdown" ? 3_000 : undefined,
    );
    if (action === "stop") {
      try {
        await connectionRef.current?.send({ type: "coach-control", ...message });
      } finally {
        applyControlMessage(message);
      }
      return;
    }
    applyControlMessage(message);
    await connectionRef.current?.send({ type: "coach-control", ...message });
  }

  function finishRun() {
    const referenceResult = summarizeDanceEvents(danceEventsRef.current);
    const result =
      mode === "dance-coach"
        ? referenceResult
        : mergeTennisAndReferenceResult(
            summarizeTennisReps(tennisRepsRef.current),
            referenceResult,
          );
    const stored = writeBrowserStorage(
      "local",
      "move-canvas:last-coach-summary",
      JSON.stringify(result),
    );
    setLatestCue(
      stored
        ? "Session complete. Only this aggregate summary is saved locally."
        : "Session complete. Browser storage is unavailable, so this aggregate summary was not saved.",
    );
    void connectionRef.current?.send({ type: "coach-result", result });
  }
  useEffect(() => {
    finishRunRef.current = finishRun;
  });

  function startPractice() {
    if (!ready) return;
    if (mode === "dance-coach") return void dispatchControl("start");
    void dispatchControl("countdown");
    if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = window.setTimeout(() => {
      countdownTimerRef.current = null;
      void dispatchControl("start");
    }, 3_000);
  }

  function cancelCountdown() {
    if (countdownTimerRef.current !== null) window.clearTimeout(countdownTimerRef.current);
    countdownTimerRef.current = null;
    void dispatchControl("cancel-countdown");
  }

  function endRun() {
    void dispatchControl("stop");
  }

  function useFixtureFraming() {
    if (testHarness && !streamRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#171524";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#c8ff54";
        context.font = "bold 42px sans-serif";
        context.fillText("PRIVATE LIVE VIEW TEST", 48, 240);
      }
      const stream = canvas.captureStream(5);
      fixtureCanvasRef.current = canvas;
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }
    }
    setConsent(true);
    setFramed(true);
    framedRef.current = true;
    const activeSession = sessionRef.current;
    if (!activeSession) return;
    const record = createCalibrationRecord(
      activeSession.id,
      FIXTURE_CALIBRATION_SAMPLES.neutral,
      FIXTURE_CALIBRATION_SAMPLES.comfortableRange,
      "fixture",
    );
    const stored = writeBrowserStorage(
      "session",
      calibrationStorageKey(activeSession.id),
      JSON.stringify(record),
    );
    if (!stored) {
      setLatestCue(
        "Fixture calibration could not be saved because session storage is unavailable.",
      );
      return;
    }
    setNeutralSample(record.neutral);
    setCalibration(record);
    calibrationRef.current = record;
    setCamera("ready");
    setLatestCue("Deterministic fixture framing ready. This is not real-camera evidence.");
  }

  function sendDanceFixture() {
    const next =
      verificationDanceEvents[danceEventsRef.current.length % verificationDanceEvents.length];
    danceEventsRef.current.push(next);
    setLatestCue(next.cue);
    void connectionRef.current?.send({
      type: "dance-feedback",
      event: next,
      sentAt: performance.now(),
    });
  }

  function sendTennisFixturePhase(phase: TennisPhase) {
    const activeSession = sessionRef.current;
    if (!activeSession?.drill) return;
    const phases = verificationTennisPhases(activeSession.drill);
    const expectedIndex =
      tennisRepsRef.current.length * phases.length +
      (Number(readBrowserStorage("session", "move-canvas:fixture-phase")) || 0);
    const expected = phases[expectedIndex % phases.length];
    if (phase !== expected) {
      setLatestCue("Out-of-order fixture phase rejected; rep remains unscored.");
      return;
    }
    const nextIndex = (expectedIndex + 1) % phases.length;
    writeBrowserStorage("session", "move-canvas:fixture-phase", String(nextIndex));
    if (nextIndex === 0) {
      tennisRepsRef.current.push({
        drill: activeSession.drill,
        phases,
        confidence: 0.9,
        issues:
          tennisRepsRef.current.length < 2
            ? [
                activeSession.drill === "shadow-serve"
                  ? "serve-trophy-height"
                  : "forehand-turn-range",
              ]
            : [],
      });
    }
    const count = tennisRepsRef.current.length;
    setRepCount(count);
    setLatestCue(`Visible fixture phase: ${phase.replaceAll("-", " ")}`);
    void connectionRef.current?.send({
      type: "tennis-progress",
      phase,
      repCount: count,
      confidence: 0.9,
      sentAt: readCoachNow(),
    });
    if (count >= 3) endRun();
  }

  const phases = session?.drill ? verificationTennisPhases(session.drill) : [];
  const elapsedMs = coachElapsed(clock, clockNow);
  const countdown =
    clock.phase === "countdown"
      ? Math.max(1, Math.ceil(((clock.countdownEndsAt ?? clockNow) - clockNow) / 1_000))
      : null;

  if (!mode || !code)
    return (
      <main className="setup-empty" id="main">
        <h1>Open a valid coaching room from the display.</h1>
        <Link className="button button-primary" href="/coach">
          Choose a mode
        </Link>
      </main>
    );

  return (
    <main className="controller-page coach-controller" id="main">
      <header className="controller-header">
        <Link className="brand brand-light" href="/coach">
          <span aria-hidden="true">M</span>Move Canvas
        </Link>
        <span className={displayPresent ? "status-pill status-ready" : "status-pill"}>
          {displayPresent ? "Display connected" : connected ? "Relay connected" : "Reconnecting"}
        </span>
      </header>
      <section className="controller-card" aria-labelledby="controller-title">
        <p className="eyebrow">
          {mode === "dance-coach" ? "DANCE COACH" : "TENNIS COACH"} · ROOM {code}
        </p>
        <h1 id="controller-title">Your movement stays private on this phone.</h1>
        <p>
          Your phone turns movement into practice signals. The TV receives those signals—not camera
          video—unless you turn on Show me on TV below.
        </p>
        <label className="consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />{" "}
          I understand the camera is processed on this phone and can stop the session at any time.
        </label>
        <video
          ref={videoRef}
          className="controller-video"
          muted
          playsInline
          aria-label="Local camera preview"
        />
        <label className="consent">
          <input
            type="checkbox"
            checked={shareVideo}
            disabled={camera === "idle" || camera === "requesting" || camera === "error"}
            onChange={(event) => updateVideoSharing(event.target.checked)}
          />{" "}
          Show my live camera on the paired TV. This uses an encrypted peer-to-peer connection and
          is never saved.
        </label>
        <p className="field-help" aria-live="polite">
          TV live view: {videoShareStatus}
        </p>
        <div className="coach-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={!consent || camera === "requesting"}
            onClick={() => void enableCamera()}
          >
            {camera === "idle" || camera === "error" ? "Enable camera" : "Restart camera"}
          </button>
          <button
            className="button button-ink"
            type="button"
            disabled={
              !session || camera === "idle" || camera === "requesting" || camera === "error"
            }
            onClick={() => armCalibrationCapture("neutral")}
          >
            {calibrationCapture?.stage === "neutral"
              ? calibrationCapture.secondsRemaining > 0
                ? `Neutral capture in ${calibrationCapture.secondsRemaining}`
                : "Cancel neutral capture"
              : "Arm neutral capture"}
          </button>
          <button
            className="button button-ink"
            type="button"
            disabled={
              !neutralSample ||
              !session ||
              camera === "idle" ||
              camera === "requesting" ||
              camera === "error"
            }
            onClick={() => armCalibrationCapture("range")}
          >
            {calibrationCapture?.stage === "range"
              ? calibrationCapture.secondsRemaining > 0
                ? `Range capture in ${calibrationCapture.secondsRemaining}`
                : "Cancel range capture"
              : "Arm comfortable range"}
          </button>
        </div>
        <p className="coach-status" aria-live="polite" role="status">
          {latestCue}
        </p>
        {calibration ? (
          <details className="calibration-record">
            <summary>Session calibration record</summary>
            <dl>
              <div>
                <dt>Version</dt>
                <dd>{calibration.version}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{calibration.source}</dd>
              </div>
              <div>
                <dt>Neutral confidence</dt>
                <dd>{Math.round(calibration.neutral.confidence * 100)}%</dd>
              </div>
              <div>
                <dt>Range: reach / knee / turn</dt>
                <dd>
                  {calibration.comfortableRange.armReach.toFixed(2)} /{" "}
                  {calibration.comfortableRange.kneeLoad.toFixed(2)} /{" "}
                  {calibration.comfortableRange.shoulderTurn.toFixed(2)}
                </dd>
              </div>
            </dl>
            <p>Stored only in this tab session under {calibration.sessionId}.</p>
          </details>
        ) : null}
        <dl className="controller-facts">
          <div>
            <dt>Camera</dt>
            <dd>{camera}</dd>
          </div>
          <div>
            <dt>Reference/setup</dt>
            <dd>{timeline ? `${timeline.frames.length} reference samples` : "waiting"}</dd>
          </div>
          <div>
            <dt>Qualified reps</dt>
            <dd>{mode === "tennis-coach" ? `${repCount} / 3` : "—"}</dd>
          </div>
        </dl>
        <p
          className="coach-clock"
          data-testid={mode === "dance-coach" ? "dance-comparison-position" : "coach-elapsed"}
        >
          {mode === "dance-coach" ? "Comparison position" : "Elapsed"}{" "}
          {(elapsedMs / 1_000).toFixed(1)}s
        </p>
        {mode === "tennis-coach" && countdown ? (
          <p role="status" aria-live="assertive" aria-atomic="true">
            Tennis practice starts in {countdown}
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
              disabled={!ready}
              onClick={startPractice}
            >
              Start on phone
            </button>
          ) : null}
          <button
            className="button button-ink"
            type="button"
            disabled={!running}
            onClick={() => void dispatchControl("pause")}
          >
            Pause
          </button>
          {clock.phase === "paused" ? (
            <button
              className="button button-primary"
              type="button"
              disabled={!ready}
              onClick={() => void dispatchControl("resume")}
            >
              Resume
            </button>
          ) : null}
          <button
            className="button button-ghost"
            type="button"
            disabled={clock.phase !== "running" && clock.phase !== "paused"}
            onClick={endRun}
          >
            End safely
          </button>
        </div>
        {testHarness ? (
          <details className="verification-controls">
            <summary>Deterministic verification controls</summary>
            <p>
              These controls verify ordered rules, messaging, and recovery without claiming
              real-camera evidence.
            </p>
            <button type="button" disabled={!session} onClick={useFixtureFraming}>
              Use fixture framing
            </button>
            {mode === "dance-coach" ? (
              <>
                <button type="button" disabled={!timeline} onClick={sendDanceFixture}>
                  Send next fixture comparison
                </button>
                <button
                  type="button"
                  disabled={!running}
                  onClick={() => {
                    setLatestCue("Fixture tracking loss requested.");
                    void dispatchControl("pause", "tracking-loss");
                  }}
                >
                  Simulate tracking loss
                </button>
              </>
            ) : (
              phases.map((phase) => (
                <button type="button" key={phase} onClick={() => sendTennisFixturePhase(phase)}>
                  {phase.replaceAll("-", " ")}
                </button>
              ))
            )}
          </details>
        ) : null}
        <p className="limitation">
          {mode === "dance-coach"
            ? "Practice cues compare visible 2D position and timing only; they do not grade artistry or replace professional coaching."
            : "2D shadow-phase practice only; no ball, racket, force, speed, spin, placement, biomechanics, or injury guidance."}
        </p>
        <small>
          {transport === "supabase" ? "Private room connection" : "Same-device verification relay"}
        </small>
      </section>
    </main>
  );
}

function mergeTennisAndReferenceResult(tennis: CoachResult, reference: CoachResult): CoachResult {
  const cues = [...reference.cues.slice(0, 1), ...tennis.cues].slice(0, 2);
  const confidenceValues = [tennis.confidence, reference.confidence].filter((value) => value > 0);
  return {
    ...tennis,
    confidence: confidenceValues.length
      ? Math.round(
          (confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) *
            1_000,
        ) / 1_000
      : 0,
    completedUnits: Math.max(tennis.completedUnits, reference.completedUnits),
    cues,
  };
}
