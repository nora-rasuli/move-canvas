import { z } from "zod";
import { gameBlueprintSchema, gestureSchema } from "./blueprint";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  coachResultSchema,
  coachSessionSchema,
  danceFeedbackEventSchema,
  danceTimelineSchema,
  tennisPhaseSchema,
} from "./coach";
import { coachControlSchema } from "./coach-clock";

export const playerSchema = z
  .object({
    id: z.string().min(1).max(80),
    name: z.string().trim().min(1).max(18),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })
  .strict();

export const playerScoreSchema = playerSchema.extend({
  score: z.number().int().min(0).max(1_000_000),
});

export const gameResultSchema = z
  .object({
    gameTitle: z.string().trim().min(1).max(48),
    score: z.number().int().min(0).max(1_000_000),
    leaderboard: z.array(playerScoreSchema).max(12),
    completedAt: z.string().min(1).max(80),
    durationSeconds: z.number().int().min(0).max(90),
    eventsReceived: z.number().int().min(0).max(100_000),
  })
  .strict();

const gamePhaseSchema = z.enum(["ready", "playing", "paused", "finished"]);
const coachModeSchema = z.enum(["dance-coach", "tennis-coach"]);
const coachCameraStateSchema = z.enum(["idle", "requesting", "framing", "ready", "lost", "error"]);
const sentAtSchema = z.number().finite().nonnegative();
const coachVideoSignalSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.enum(["offer", "answer"]),
      sdp: z.string().min(1).max(120_000),
    })
    .strict(),
  z
    .object({
      kind: z.literal("ice"),
      candidate: z.string().min(1).max(8_000),
      sdpMid: z.string().max(200).nullable(),
      sdpMLineIndex: z.number().int().min(0).max(100).nullable(),
    })
    .strict(),
]);

export const sessionMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("controller-ready"), player: playerSchema }).strict(),
  z.object({ type: z.literal("controller-left"), playerId: z.string().min(1).max(80) }).strict(),
  z.object({ type: z.literal("display-ready") }).strict(),
  z
    .object({
      type: z.literal("gesture"),
      playerId: z.string().min(1).max(80),
      gesture: gestureSchema,
      sentAt: sentAtSchema,
    })
    .strict(),
  z.object({ type: z.literal("start") }).strict(),
  z.object({ type: z.literal("pause") }).strict(),
  z.object({ type: z.literal("resume") }).strict(),
  z
    .object({
      type: z.literal("game-state"),
      phase: gamePhaseSchema,
      score: z.number().int().min(0).max(1_000_000),
      lives: z.number().int().min(0).max(3),
      remainingSeconds: z.number().int().min(0).max(90),
      requiredGesture: gestureSchema.nullable(),
      players: z.array(playerScoreSchema).max(12),
    })
    .strict(),
  z.object({ type: z.literal("result"), result: gameResultSchema }).strict(),
  z.object({ type: z.literal("blueprint"), payload: gameBlueprintSchema }).strict(),
  z
    .object({
      type: z.literal("coach-controller-state"),
      mode: coachModeSchema,
      sessionId: z.string().min(1).max(80).nullable(),
      camera: coachCameraStateSchema,
      consent: z.boolean(),
      framed: z.boolean(),
      calibrated: z.boolean(),
      referenceReady: z.boolean(),
      sentAt: sentAtSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("coach-controller-left"),
      mode: coachModeSchema,
      sentAt: sentAtSchema,
    })
    .strict(),
  z.object({ type: z.literal("coach-display-ready"), mode: coachModeSchema }).strict(),
  z
    .object({
      type: z.literal("coach-video-signal"),
      mode: coachModeSchema,
      from: z.enum(["phone", "display"]),
      signal: coachVideoSignalSchema,
    })
    .strict(),
  z.object({ type: z.literal("coach-session"), session: coachSessionSchema }).strict(),
  z.object({ type: z.literal("dance-reference"), timeline: danceTimelineSchema }).strict(),
  z
    .object({ type: z.literal("coach-control") })
    .extend(coachControlSchema.shape)
    .strict(),
  z
    .object({
      type: z.literal("dance-feedback"),
      event: danceFeedbackEventSchema,
      sentAt: sentAtSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("tennis-progress"),
      phase: tennisPhaseSchema.nullable(),
      repCount: z.number().int().min(0).max(100),
      confidence: z.number().min(0).max(1),
      sentAt: sentAtSchema,
    })
    .strict(),
  z.object({ type: z.literal("coach-result"), result: coachResultSchema }).strict(),
]);

export type GameResult = z.infer<typeof gameResultSchema>;
export type Player = z.infer<typeof playerSchema>;
export type PlayerScore = z.infer<typeof playerScoreSchema>;
export type SessionMessage = z.infer<typeof sessionMessageSchema>;
export type CoachControllerStateMessage = Extract<
  SessionMessage,
  { type: "coach-controller-state" }
>;

export function parseSessionMessage(value: unknown): SessionMessage | null {
  return sessionMessageSchema.safeParse(value).data ?? null;
}

export type SessionConnection = {
  mode: "supabase" | "same-device";
  send: (message: SessionMessage) => Promise<void>;
  close: () => Promise<void>;
};

export function createRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12)
    .toUpperCase();
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

export async function getBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("The shared game service is not configured.");
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
      const client = await getBrowserSupabaseClient();

      const channel = client
        .channel(roomTopic(code), { config: { private: true } })
        .on("broadcast", { event: "message" }, ({ payload }) => {
          const message = parseSessionMessage(payload);
          if (message) onMessage(message);
        });

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
          const status = await channel.send({
            type: "broadcast",
            event: "message",
            payload: message,
          });
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
  channel.onmessage = (event: MessageEvent<unknown>) => {
    const message = parseSessionMessage(event.data);
    if (message) onMessage(message);
  };
  onStatus(true);
  return {
    mode: "same-device",
    async send(message) {
      channel.postMessage(message);
    },
    async close() {
      channel.close();
    },
  };
}
