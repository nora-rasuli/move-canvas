import { describe, expect, it, vi } from "vitest";
import { applyCoachControl, coachElapsed, createCoachClock, syncReferenceMedia, type CoachControl } from "./coach-clock";

const control = (action: CoachControl["action"], elapsedMs: number, id: string = action): CoachControl => ({
  id,
  action,
  origin: "phone",
  sentAt: 0,
  elapsedMs,
  ...(action === "countdown" ? { countdownMs: 3_000 } : {}),
});

describe("shared coaching clock", () => {
  it("preserves one elapsed offset through pause and resume", () => {
    const started = applyCoachControl(createCoachClock(), control("start", 0), 100);
    expect(coachElapsed(started, 1_100)).toBe(1_000);
    const paused = applyCoachControl(started, control("pause", 1_000), 1_100);
    expect(coachElapsed(paused, 1_900)).toBe(1_000);
    const resumed = applyCoachControl(paused, control("resume", 1_000), 2_000);
    expect(coachElapsed(resumed, 2_500)).toBe(1_500);
    const duplicatePause = applyCoachControl(resumed, control("pause", 1_500, "same-control"), 2_500);
    expect(applyCoachControl(duplicatePause, control("pause", 1_500, "same-control"), 2_900)).toMatchObject({ phase: "paused", elapsedMs: 1_500 });
  });

  it("maps start, pause, resume, and stop to display media at the shared offset", () => {
    const media = { currentTime: 99, play: vi.fn(async () => undefined), pause: vi.fn() };
    syncReferenceMedia(media, control("start", 0));
    expect(media.currentTime).toBe(0);
    syncReferenceMedia(media, control("pause", 1_250));
    expect(media.pause).toHaveBeenCalledTimes(1);
    expect(media.currentTime).toBe(1.25);
    syncReferenceMedia(media, control("resume", 1_250));
    expect(media.play).toHaveBeenCalledTimes(2);
    expect(media.currentTime).toBe(1.25);
    syncReferenceMedia(media, control("stop", 2_000));
    expect(media.pause).toHaveBeenCalledTimes(2);
    expect(media.currentTime).toBe(2);
  });

  it("supports cancelable countdown state without starting the clock", () => {
    const countdown = applyCoachControl(createCoachClock(), control("countdown", 0), 500);
    expect(countdown).toMatchObject({ phase: "countdown", countdownEndsAt: 3_500, elapsedMs: 0 });
    expect(applyCoachControl(countdown, control("cancel-countdown", 0), 900).phase).toBe("idle");
  });
});
