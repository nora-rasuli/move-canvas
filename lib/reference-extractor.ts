import type { Landmark, PoseFrame } from "./pose";
import { buildDanceTimeline, DANCE_SAMPLE_INTERVAL_MS, type DanceOrientation } from "./dance";
import type { DanceTimeline } from "./coach";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
const SUPPORTED_TYPES = new Set(["video/mp4", "video/webm"]);

export type LoadedReference = {
  objectUrl: string;
  durationMs: number;
  dispose: () => void;
};

export function validateReferenceFile(file: File) {
  const extensionSupported = /\.(mp4|webm)$/i.test(file.name);
  if (!SUPPORTED_TYPES.has(file.type) && !extensionSupported) {
    throw new Error("Choose a local MP4 or WebM reference clip.");
  }
  if (file.size === 0) throw new Error("The selected reference clip is empty.");
}

export async function loadReferenceVideo(file: File, video: HTMLVideoElement): Promise<LoadedReference> {
  validateReferenceFile(file);
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  try {
    await waitFor(video, "loadedmetadata");
    if (!Number.isFinite(video.duration)) throw new Error("The browser could not read this clip duration.");
    const durationMs = Math.round(video.duration * 1_000);
    if (durationMs < 10_000 || durationMs > 90_000) throw new Error("Reference clips must be between 10 and 90 seconds.");
    return { objectUrl, durationMs, dispose: () => URL.revokeObjectURL(objectUrl) };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
    throw error;
  }
}

export async function extractReferenceTimeline(
  video: HTMLVideoElement,
  durationMs: number,
  orientation: DanceOrientation,
  onProgress?: (progress: number) => void,
): Promise<DanceTimeline> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
  const landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 2,
    minPoseDetectionConfidence: 0.55,
    minPosePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
  const frames: PoseFrame[] = [];
  let multiplePeopleDetected = false;
  try {
    for (let at = 0; at <= durationMs; at += DANCE_SAMPLE_INTERVAL_MS) {
      const targetTime = Math.min(at / 1_000, Math.max(0, video.duration - 0.001));
      if (Math.abs(video.currentTime - targetTime) > 0.001 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        video.currentTime = targetTime;
        await waitFor(video, "seeked");
      }
      const result = landmarker.detectForVideo(video, at);
      if (result.landmarks.length > 1) multiplePeopleDetected = true;
      const landmarks = result.landmarks[0] as Landmark[] | undefined;
      if (landmarks) frames.push({ capturedAt: at, landmarks });
      if (at % 1_000 === 0) onProgress?.(Math.min(1, at / durationMs));
    }
    onProgress?.(1);
    if (multiplePeopleDetected) throw new Error("The reference must show one clearly visible person at a time.");
    return buildDanceTimeline(frames, durationMs, orientation);
  } finally {
    landmarker.close();
  }
}

function waitFor(video: HTMLVideoElement, eventName: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => finish(new Error(eventName === "seeked" ? "Reference decoding timed out." : "The browser could not decode this reference clip.")), 8_000);
    const onEvent = () => finish();
    const onError = () => finish(new Error("The browser could not decode this reference clip."));
    const finish = (error?: Error) => {
      window.clearTimeout(timeout);
      video.removeEventListener(eventName, onEvent);
      video.removeEventListener("error", onError);
      if (error) reject(error); else resolve();
    };
    video.addEventListener(eventName, onEvent, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}
