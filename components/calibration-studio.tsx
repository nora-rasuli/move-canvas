"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GameBlueprint, Gesture } from "@/lib/blueprint";
import { hasTrackableBody, type CalibrationProfile, type PoseFrame } from "@/lib/pose";
import { startPoseSession, type PoseSession } from "@/lib/pose-landmarker";

type CameraState = "idle" | "requesting" | "ready" | "denied" | "missing";
type PoseState = "idle" | "loading" | "tracking" | "out-of-frame" | "error";

export function CalibrationStudio() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseSessionRef = useRef<PoseSession | null>(null);
  const latestFrameRef = useRef<PoseFrame | null>(null);
  const samplesRef = useRef<CalibrationProfile["samples"]>({});
  const [game] = useState<GameBlueprint | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("move-canvas:active-blueprint");
    return stored ? (JSON.parse(stored) as GameBlueprint) : null;
  });
  const [camera, setCamera] = useState<CameraState>("idle");
  const [pose, setPose] = useState<PoseState>("idle");
  const [captured, setCaptured] = useState<Gesture[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => {
      poseSessionRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (camera !== "ready" || !videoRef.current) return;
    let cancelled = false;
    setPose("loading");
    void startPoseSession(videoRef.current, (frame) => {
      latestFrameRef.current = frame;
      setPose(frame && hasTrackableBody(frame.landmarks) ? "tracking" : "out-of-frame");
    })
      .then((session) => {
        if (cancelled) session.stop();
        else poseSessionRef.current = session;
      })
      .catch(() => {
        if (!cancelled) setPose("error");
      });
    return () => {
      cancelled = true;
      poseSessionRef.current?.stop();
      poseSessionRef.current = null;
    };
  }, [camera]);

  async function enableCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("missing");
      return;
    }
    setCamera("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamera("ready");
    } catch {
      setCamera("denied");
    }
  }

  function capture(gesture: Gesture) {
    const frame = latestFrameRef.current;
    if (camera !== "ready" || pose !== "tracking" || !frame || captured.includes(gesture)) return;
    samplesRef.current[gesture] = frame;
    setCaptured((current) => [...current, gesture]);
  }

  if (!game) {
    return (
      <main className="setup-empty" id="main">
        <p className="eyebrow">NO BLUEPRINT YET</p>
        <h1>Create a game before you calibrate.</h1>
        <Link className="button button-primary" href="/#create">Back to creator</Link>
      </main>
    );
  }

  const complete = game.gestures.every((gesture) => captured.includes(gesture));

  function saveCalibration() {
    const profile: CalibrationProfile = {
      version: "1.0",
      capturedAt: new Date().toISOString(),
      samples: samplesRef.current,
    };
    localStorage.setItem("move-canvas:calibration", JSON.stringify(profile));
    router.push("/pair");
  }

  return (
    <main className="calibration" id="main">
      <header className="setup-header">
        <Link className="brand" href="/" aria-label="Move Canvas home"><span aria-hidden="true">M</span>Move Canvas</Link>
        <p>Set up · 1 of 2</p>
      </header>
      <section className="calibration-layout">
        <div className="camera-panel">
          <video ref={videoRef} muted playsInline aria-label="Your live calibration camera" />
          {camera !== "ready" ? (
            <div className="camera-permission">
              <span className="camera-icon" aria-hidden="true">◉</span>
              <h1>Find your play space.</h1>
              <p>Prop your phone up so your head, hands, and knees fit in frame. Video stays on this device.</p>
              <button className="button button-primary" type="button" onClick={enableCamera} disabled={camera === "requesting"}>
                {camera === "requesting" ? "Opening camera…" : "Enable camera"}
              </button>
              {camera === "denied" ? <p className="form-error" role="alert">Camera access was blocked. Allow it in browser settings, then try again.</p> : null}
              {camera === "missing" ? <p className="form-error" role="alert">This browser does not expose a camera. Open this page on your phone.</p> : null}
            </div>
          ) : (
            <div className="frame-guide" aria-hidden="true">
              <span>{poseLabel(pose)}</span>
            </div>
          )}
        </div>

        <div className="calibration-copy">
          <p className="eyebrow">{game.title.toUpperCase()}</p>
          <h1>Teach the game<br />your comfortable moves.</h1>
          <p>Move only as far as feels natural. These captures set personal thresholds; they are not a fitness score.</p>
          <ol className="capture-list">
            {game.gestures.map((gesture, index) => {
              const done = captured.includes(gesture);
              return (
                <li key={gesture} className={done ? "captured" : ""}>
                  <span>{done ? "✓" : index + 1}</span>
                  <div><strong>{formatGesture(gesture)}</strong><small>{instruction(gesture)}</small></div>
                  <button type="button" disabled={pose !== "tracking" || done} onClick={() => capture(gesture)}>
                    {done ? "Captured" : "Capture"}
                  </button>
                </li>
              );
            })}
          </ol>
          <button className="button button-ink setup-next" type="button" disabled={!complete} onClick={saveCalibration}>
            Pair a display <span aria-hidden="true">→</span>
          </button>
          <p className="setup-note">Landmarks are processed on this device. Move Canvas stores the four calibration snapshots locally; it does not store or upload video frames.</p>
        </div>
      </section>
    </main>
  );
}

const formatGesture = (value: string) => value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
const instruction = (gesture: Gesture) => ({
  reach_left: "Reach left without stepping out of frame.",
  reach_right: "Reach right without leaning past comfort.",
  duck: "Lower only as far as feels easy to repeat.",
  freeze: "Return to your neutral standing pose.",
})[gesture];

const poseLabel = (state: PoseState) => ({
  idle: "Stand here",
  loading: "Starting pose tracking…",
  tracking: "Body in frame",
  "out-of-frame": "Step back until your body is visible",
  error: "Pose model could not start",
})[state];
