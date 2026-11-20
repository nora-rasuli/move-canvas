import type { Landmark, PoseFrame } from "./pose";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

export type PoseSession = { stop: () => void };

export async function startPoseSession(
  video: HTMLVideoElement,
  onFrame: (frame: PoseFrame | null) => void,
): Promise<PoseSession> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
  const landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.55,
    minPosePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });

  let active = true;
  let animationFrame = 0;
  let lastVideoTime = -1;

  const detect = () => {
    if (!active) return;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.landmarks[0] as Landmark[] | undefined;
      onFrame(landmarks ? { capturedAt: performance.now(), landmarks } : null);
    }
    animationFrame = requestAnimationFrame(detect);
  };
  animationFrame = requestAnimationFrame(detect);

  return {
    stop() {
      active = false;
      cancelAnimationFrame(animationFrame);
      landmarker.close();
    },
  };
}
