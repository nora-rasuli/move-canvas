import type { CoachControllerStateMessage } from "./channel";

export type CoachMode = "dance-coach" | "tennis-coach";

export const CONTROLLER_HEARTBEAT_INTERVAL_MS = 2_000;
export const CONTROLLER_HEARTBEAT_TIMEOUT_MS = 6_500;

export type CoachReadiness = {
  peerPresent: boolean;
  ready: boolean;
  status: string;
};

export function evaluateCoachReadiness({
  relayConnected,
  controller,
  expectedMode,
  expectedSessionId,
  referenceRequired,
  now = Date.now(),
}: {
  relayConnected: boolean;
  controller: CoachControllerStateMessage | null;
  expectedMode: CoachMode;
  expectedSessionId: string | null;
  referenceRequired: boolean;
  now?: number;
}): CoachReadiness {
  if (!relayConnected) return { peerPresent: false, ready: false, status: "Relay reconnecting" };
  if (
    !controller ||
    controller.mode !== expectedMode ||
    now - controller.sentAt > CONTROLLER_HEARTBEAT_TIMEOUT_MS
  )
    return { peerPresent: false, ready: false, status: "Waiting for phone" };

  const pending = (status: string): CoachReadiness => ({
    peerPresent: true,
    ready: false,
    status,
  });

  if (!expectedSessionId || controller.sessionId !== expectedSessionId)
    return pending("Phone connected · loading session");
  if (!controller.consent) return pending("Phone connected · camera consent needed");
  if (controller.camera === "error") return pending("Phone connected · camera needs attention");
  if (controller.camera === "lost" || !controller.framed)
    return pending("Phone connected · full-body framing needed");
  if (controller.camera !== "ready") return pending("Phone connected · camera setup in progress");
  if (!controller.calibrated) return pending("Phone connected · calibration needed");
  if (referenceRequired && !controller.referenceReady)
    return pending("Phone ready · sending movement reference");
  return { peerPresent: true, ready: true, status: "Phone ready" };
}
