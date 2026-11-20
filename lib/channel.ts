import type { Gesture } from "./blueprint";
import type { GamePhase } from "./engine";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CoachResult,
  CoachSession,
  DanceFeedbackEvent,
  DanceTimeline,
  TennisPhase,
} from "./coach";

export type GameResult = {
  gameTitle: string;
  score: number;
  leaderboard: PlayerScore[];
  completedAt: string;
  durationSeconds: number;
  eventsReceived: number;
};

export type Player = {
  id: string;
  name: string;
  color: string;
};

export type PlayerScore = Player & {
  score: number;
};

export type SessionMessage =
  | { type: "controller-ready"; player: Player }
  | { type: "controller-left"; playerId: string }
  | { type: "display-ready" }
  | { type: "gesture"; playerId: string; gesture: Gesture; sentAt: number }
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "game-state"; phase: GamePhase; score: number; lives: number; remainingSeconds: number; requiredGesture: Gesture | null; players: PlayerScore[] }
  | { type: "result"; result: GameResult }
  | { type: "blueprint"; payload: unknown }
  | { type: "coach-controller-ready"; mode: "dance-coach" | "tennis-coach" }
  | { type: "coach-session"; session: CoachSession }
  | { type: "dance-reference"; timeline: DanceTimeline }
  | { type: "coach-control"; action: "start" | "pause" | "resume" | "stop"; sentAt: number }
  | { type: "dance-feedback"; event: DanceFeedbackEvent; sentAt: number }
  | { type: "tennis-progress"; phase: TennisPhase | null; repCount: number; confidence: number; sentAt: number }
  | { type: "coach-result"; result: CoachResult };

export type SessionConnection = {
  mode: "supabase" | "same-device";
  send: (message: SessionMessage) => Promise<void>;
  close: () => Promise<void>;
};

export function createRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 12).toUpperCase();
}

export const roomTopic = (code: string) => `move-canvas:${code}`;

const PLAYER_COLORS = ["#C8FF54", "#FF6B62", "#8A70FF", "#56D6FF", "#FFCE65", "#FF7AC8"];
let browserClientPromise: Promise<SupabaseClient> | null = null;

export function createPlayer(): Player {
  const id = crypto.randomUUID();
  const colorIndex = Number.parseInt(id.slice(-2), 16) % PLAYER_COLORS.length;
  return {
    id,
    name: `Player ${id.slice(0, 2).toUpperCase()}`,
    color: PLAYER_COLORS[colorIndex],
  };
}

async function getBrowserClient(url: string, key: string) {
  if (!browserClientPromise) {
    browserClientPromise = (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
      const { data: existingSession, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!existingSession.session) {
        const { error: signInError } = await client.auth.signInAnonymously();
        if (signInError) throw signInError;
      }
      return client;
    })().catch((error) => {
      browserClientPromise = null;
      throw error;
    });
  }
  return browserClientPromise;
}

export async function connectSession(
  code: string,
  onMessage: (message: SessionMessage) => void,
  onStatus: (connected: boolean) => void,
): Promise<SessionConnection> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    try {
      const client = await getBrowserClient(url, key);

      const channel = client
        .channel(roomTopic(code), { config: { private: true } })
        .on("broadcast", { event: "message" }, ({ payload }) => onMessage(payload as SessionMessage));

      await new Promise<void>((resolve, reject) => {
        channel.subscribe((status, error) => {
          const connected = status === "SUBSCRIBED";
          onStatus(connected);
          if (connected) resolve();
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            reject(error ?? new Error(`Realtime subscription failed: ${status}`));
          }
        });
      });

      let closed = false;
      return {
        mode: "supabase",
        async send(message) {
          if (closed) return;
          const status = await channel.send({ type: "broadcast", event: "message", payload: message });
          if (status !== "ok") throw new Error(`Realtime message failed: ${status}`);
        },
        async close() {
          closed = true;
          await client.removeChannel(channel);
        },
      };
    } catch (error) {
      console.error("Move Canvas Realtime relay unavailable; using same-device fallback.", error);
      onStatus(false);
    }
  }

  const channel = new BroadcastChannel(roomTopic(code));
  channel.onmessage = (event: MessageEvent<SessionMessage>) => onMessage(event.data);
  onStatus(true);
  return {
    mode: "same-device",
    async send(message) { channel.postMessage(message); },
    async close() { channel.close(); },
  };
}
