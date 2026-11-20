import type { Gesture } from "./blueprint";

export type SessionMessage =
  | { type: "controller-ready" }
  | { type: "display-ready" }
  | { type: "gesture"; gesture: Gesture; sentAt: number }
  | { type: "start" }
  | { type: "pause" }
  | { type: "blueprint"; payload: unknown };

export type SessionConnection = {
  mode: "supabase" | "same-device";
  send: (message: SessionMessage) => Promise<void>;
  close: () => Promise<void>;
};

export function createRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 12).toUpperCase();
}

export async function connectSession(
  code: string,
  onMessage: (message: SessionMessage) => void,
  onStatus: (connected: boolean) => void,
): Promise<SessionConnection> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const channel = client
      .channel(`move-canvas:${code}`)
      .on("broadcast", { event: "message" }, ({ payload }) => onMessage(payload as SessionMessage));
    channel.subscribe((status) => onStatus(status === "SUBSCRIBED"));
    return {
      mode: "supabase",
      async send(message) {
        await channel.send({ type: "broadcast", event: "message", payload: message });
      },
      async close() {
        await client.removeChannel(channel);
      },
    };
  }

  const channel = new BroadcastChannel(`move-canvas:${code}`);
  channel.onmessage = (event: MessageEvent<SessionMessage>) => onMessage(event.data);
  onStatus(true);
  return {
    mode: "same-device",
    async send(message) { channel.postMessage(message); },
    async close() { channel.close(); },
  };
}
