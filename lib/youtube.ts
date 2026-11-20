import { z } from "zod";

export const youtubeResultSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    title: z.string().trim().min(1).max(200),
    channelTitle: z.string().trim().min(1).max(160),
    thumbnail: z.string().url(),
  })
  .strict();

export const youtubeSearchResponseSchema = z
  .object({ results: z.array(youtubeResultSchema).max(8) })
  .strict();

export type YouTubeResult = z.infer<typeof youtubeResultSchema>;

export function youtubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?playsinline=1&rel=0`;
}
