import { NextResponse } from "next/server";
import { z } from "zod";
import { youtubeResultSchema } from "@/lib/youtube";

const querySchema = z.string().trim().min(2).max(80);

export async function GET(request: Request) {
  const query = querySchema.safeParse(new URL(request.url).searchParams.get("q"));
  if (!query.success) {
    return NextResponse.json({ error: "Search with at least two characters." }, { status: 400 });
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "YouTube search is not configured yet.", configured: false },
      { status: 503 },
    );
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: query.data,
    type: "video",
    maxResults: "8",
    safeSearch: "strict",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    videoDuration: "short",
    key,
  });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    return NextResponse.json(
      { error: "YouTube search is temporarily unavailable." },
      { status: 502 },
    );
  }
  const payload = (await response.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };
  const results = (payload.items ?? []).flatMap((item) => {
    const candidate = youtubeResultSchema.safeParse({
      id: item.id?.videoId,
      title: decodeEntities(item.snippet?.title ?? ""),
      channelTitle: decodeEntities(item.snippet?.channelTitle ?? ""),
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url,
    });
    return candidate.success ? [candidate.data] : [];
  });
  return NextResponse.json({ results });
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
