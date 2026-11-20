import { z } from "zod";

export type CoachControlAction =
  | "countdown"
  | "cancel-countdown"
  | "start"
  | "pause"
  | "resume"
  | "stop";
export type CoachControlOrigin = "display" | "phone" | "tracking-loss";

export type CoachControl = {
  id: string;
  action: CoachControlAction;
  origin: CoachControlOrigin;
  sentAt: number;
  elapsedMs: number;
  countdownMs?: number;
};

export const coachControlSchema = z
  .object({
    id: z.string().uuid(),
    action: z.enum(["countdown", "cancel-countdown", "start", "pause", "resume", "stop"]),
    origin: z.enum(["display", "phone", "tracking-loss"]),
    sentAt: z.number().finite().nonnegative(),
    elapsedMs: z
      .number()
      .finite()
      .min(0)
      .max(24 * 60 * 60 * 1_000),
    countdownMs: z.number().finite().min(0).max(10_000).optional(),
  })
  .strict();

export type CoachClock = {
  phase: "idle" | "countdown" | "running" | "paused" | "finished";
  elapsedMs: number;
  anchoredAt: number;
  countdownEndsAt: number | null;
};

export const createCoachClock = (): CoachClock => ({
  phase: "idle",
  elapsedMs: 0,
  anchoredAt: 0,
  countdownEndsAt: null,
});

export const readCoachNow = () => performance.now();

export function coachElapsed(clock: CoachClock, now: number) {
  return Math.max(
    0,
    Math.round(clock.elapsedMs + (clock.phase === "running" ? now - clock.anchoredAt : 0)),
  );
}

export function applyCoachControl(
  clock: CoachClock,
  control: CoachControl,
  receivedAt: number,
): CoachClock {
  if (clock.phase === "finished" && control.action !== "start" && control.action !== "countdown")
    return clock;
  if (control.action === "pause" && (clock.phase === "paused" || clock.phase === "finished"))
    return clock;
  if ((control.action === "start" || control.action === "resume") && clock.phase === "running")
    return clock;
  if (control.action === "countdown" && clock.phase === "countdown") return clock;
  if (control.action === "cancel-countdown" && clock.phase === "idle") return clock;
  const elapsedMs = Math.max(0, Math.round(control.elapsedMs));
  if (control.action === "countdown") {
    return {
      phase: "countdown",
      elapsedMs: 0,
      anchoredAt: receivedAt,
      countdownEndsAt: receivedAt + (control.countdownMs ?? 3_000),
    };
  }
  if (control.action === "cancel-countdown") {
    return { phase: "idle", elapsedMs: 0, anchoredAt: receivedAt, countdownEndsAt: null };
  }
  if (control.action === "start") {
    return { phase: "running", elapsedMs: 0, anchoredAt: receivedAt, countdownEndsAt: null };
  }
  if (control.action === "resume") {
    return { phase: "running", elapsedMs, anchoredAt: receivedAt, countdownEndsAt: null };
  }
  return {
    phase: control.action === "pause" ? "paused" : "finished",
    elapsedMs,
    anchoredAt: receivedAt,
    countdownEndsAt: null,
  };
}

export function createCoachControl(
  action: CoachControlAction,
  origin: CoachControlOrigin,
  clock: CoachClock,
  now: number,
  countdownMs?: number,
): CoachControl {
  return {
    id: crypto.randomUUID(),
    action,
    origin,
    sentAt: now,
    elapsedMs:
      action === "start" || action === "countdown" || action === "cancel-countdown"
        ? 0
        : coachElapsed(clock, now),
    ...(countdownMs ? { countdownMs } : {}),
  };
}

export function createClockSyncControl(
  clock: CoachClock,
  now: number,
  origin: CoachControlOrigin = "display",
): CoachControl | null {
  if (clock.phase === "running") return createCoachControl("resume", origin, clock, now);
  if (clock.phase === "paused") return createCoachControl("pause", origin, clock, now);
  if (clock.phase === "countdown") {
    return createCoachControl(
      "countdown",
      origin,
      clock,
      now,
      Math.max(0, (clock.countdownEndsAt ?? now) - now),
    );
  }
  return null;
}

export function syncReferenceMedia(
  media: Pick<HTMLMediaElement, "currentTime" | "play" | "pause">,
  control: Pick<CoachControl, "action" | "elapsedMs">,
) {
  if (control.action === "start") {
    media.currentTime = 0;
    void media.play().catch(() => undefined);
  }
  if (control.action === "resume") {
    media.currentTime = control.elapsedMs / 1_000;
    void media.play().catch(() => undefined);
  }
  if (control.action === "pause" || control.action === "stop") {
    media.pause();
    media.currentTime = control.elapsedMs / 1_000;
  }
}
