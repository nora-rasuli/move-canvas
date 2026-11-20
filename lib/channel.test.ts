import { describe, expect, it, vi } from "vitest";
import { createPlayer, createRoomCode, roomTopic } from "./channel";

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
