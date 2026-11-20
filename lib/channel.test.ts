import { describe, expect, it, vi } from "vitest";
import { createPlayer, createRoomCode, parseSessionMessage, roomTopic } from "./channel";
import { createFallbackBlueprint } from "./blueprint";

describe("room identity", () => {
  it("creates a 12-character uppercase base36 possession code", () => {
    vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(35) });
    expect(createRoomCode()).toMatch(/^[0-9A-Z]{12}$/);
    vi.unstubAllGlobals();
  });

  it("names the private Realtime topic consistently", () => {
    expect(roomTopic("A1B2C3D4E5F6")).toBe("move-canvas:A1B2C3D4E5F6");
  });

  it("creates a stable player-shaped identity", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "a1b2c3d4-0000-4000-8000-00000000000f" });
    expect(createPlayer()).toEqual({
      id: "a1b2c3d4-0000-4000-8000-00000000000f",
      name: "Player A1",
      color: "#56D6FF",
    });
    vi.unstubAllGlobals();
  });
});

describe("session message boundary", () => {
  it("accepts a schema-valid blueprint message", () => {
    const message = parseSessionMessage({
      type: "blueprint",
      payload: createFallbackBlueprint("A moonlit ocean game with pearls"),
    });
    expect(message?.type).toBe("blueprint");
  });

  it("accepts the valid room and coaching handshake messages", () => {
    const player = {
      id: "host-player",
      name: "Nora",
      color: "#C8FF54",
    };
    expect(parseSessionMessage({ type: "controller-ready", player })).toEqual({
      type: "controller-ready",
      player,
    });
    expect(
      parseSessionMessage({
        type: "coach-controller-state",
        mode: "dance-coach",
        sessionId: "dance-coach-ABC123DEF456",
        camera: "ready",
        consent: true,
        framed: true,
        calibrated: true,
        referenceReady: true,
        sentAt: 1_800_000_000_000,
      }),
    ).toMatchObject({
      type: "coach-controller-state",
      camera: "ready",
      calibrated: true,
    });
    expect(
      parseSessionMessage({
        type: "coach-session",
        session: {
          id: "dance-coach-ABC123DEF456",
          roomCode: "ABC123DEF456",
          mode: "dance-coach",
          createdAt: "2026-11-20T00:00:00.000Z",
          status: "ready",
          clipLabel: "",
        },
      }),
    ).not.toBeNull();
    expect(
      parseSessionMessage({
        type: "coach-video-signal",
        mode: "tennis-coach",
        from: "phone",
        signal: { kind: "offer", sdp: "v=0\r\n" },
      }),
    ).toMatchObject({ type: "coach-video-signal", from: "phone" });
  });

  it("rejects malformed or oversized relay payloads", () => {
    expect(parseSessionMessage({ type: "blueprint", payload: { title: "unsafe" } })).toBeNull();
    expect(
      parseSessionMessage({
        type: "coach-controller-state",
        mode: "tennis-coach",
        sessionId: null,
        camera: "ready",
        consent: true,
        framed: true,
        calibrated: false,
        referenceReady: true,
        sentAt: 0,
        rawLandmarks: [],
      }),
    ).toBeNull();
    expect(
      parseSessionMessage({
        type: "coach-video-signal",
        mode: "dance-coach",
        from: "phone",
        signal: { kind: "offer", sdp: "x".repeat(120_001) },
      }),
    ).toBeNull();
    expect(
      parseSessionMessage({
        type: "controller-ready",
        player: { id: "visitor", name: "x".repeat(80), color: "red" },
      }),
    ).toBeNull();
    expect(
      parseSessionMessage({
        type: "coach-control",
        id: "not-a-uuid",
        action: "start",
        origin: "phone",
        sentAt: 0,
        elapsedMs: 0,
      }),
    ).toBeNull();
  });
});
