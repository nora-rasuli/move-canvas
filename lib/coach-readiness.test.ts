import { describe, expect, it } from "vitest";
import { evaluateCoachReadiness } from "./coach-readiness";
import type { CoachControllerStateMessage } from "./channel";

const NOW = 1_800_000_000_000;

const state = (overrides: Partial<CoachControllerStateMessage> = {}) =>
  ({
    type: "coach-controller-state",
    mode: "tennis-coach",
    sessionId: "tennis-coach-ABC123DEF456",
    camera: "ready",
    consent: true,
    framed: true,
    calibrated: true,
    referenceReady: true,
    sentAt: NOW,
    ...overrides,
  }) satisfies CoachControllerStateMessage;

const readiness = (controller: CoachControllerStateMessage | null) =>
  evaluateCoachReadiness({
    relayConnected: true,
    controller,
    expectedMode: "tennis-coach",
    expectedSessionId: "tennis-coach-ABC123DEF456",
    referenceRequired: false,
    now: NOW,
  });

describe("coach controller readiness", () => {
  it("does not confuse a display relay subscription with a phone peer", () => {
    expect(readiness(null)).toEqual({
      peerPresent: false,
      ready: false,
      status: "Waiting for phone",
    });
  });

  it.each([
    ["consent", state({ consent: false })],
    ["framing", state({ camera: "framing", framed: false })],
    ["calibration", state({ calibrated: false })],
    ["session", state({ sessionId: null })],
  ])("keeps %s-only controller state unready", (_label, controller) => {
    expect(readiness(controller).ready).toBe(false);
    expect(readiness(controller).peerPresent).toBe(true);
  });

  it("requires the Dance reference on the phone in addition to calibrated camera readiness", () => {
    const result = evaluateCoachReadiness({
      relayConnected: true,
      controller: state({ mode: "dance-coach", referenceReady: false }),
      expectedMode: "dance-coach",
      expectedSessionId: "tennis-coach-ABC123DEF456",
      referenceRequired: true,
      now: NOW,
    });
    expect(result.ready).toBe(false);
    expect(result.status).toMatch(/movement reference/i);
  });

  it("expires a missing controller heartbeat and accepts only a fully ready current session", () => {
    expect(readiness(state({ sentAt: NOW - 7_000 })).peerPresent).toBe(false);
    expect(readiness(state())).toEqual({
      peerPresent: true,
      ready: true,
      status: "Phone ready",
    });
  });
});
