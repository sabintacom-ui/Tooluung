import "server-only";
import { sshExec } from "../remote/ssh";

export type DiscoveredVideo = {
  url: string;
  videoId: string;
  title: string;
  channel: string;
  durationSec: number;
  thumbnail?: string;
  viewCount?: number;
};

const DEFAULT_KEYWORDS = [
  "ceramah",
  "kajian",
  "khutbah",
  "tausiyah",
  "ustadz",
  "habib",
  "sejarah islam",
  "tafsir",
  "fiqh",
  "akidah",
];

/**
 * Discover trending Indonesian videos via yt-dlp scrape of YouTube trending feed.
 * Filters by keywords and minimum duration. No YouTube API key required.
 */
export async function discoverTrending(input?: {
  keywords?: string[];
  minDurationSec?: number;
  maxDurationSec?: number;
  limit?: number;
}): Promise<DiscoveredVideo[]> {
  const keywords = (input?.keywords ?? DEFAULT_KEYWORDS).map((k) => k.toLowerCase());
  const minDuration = input?.minDurationSec ?? 600; // 10 min minimum
  const maxDuration = input?.maxDurationSec ?? 7200; // 2 hour max
  const limit = input?.limit ?? 20;

  // Use yt-dlp search instead of trending feed (more reliable for keyword filtering)
  const searchQuery = keywords.slice(0, 3).join(" OR ");
  const cmd = [
    "yt-dlp",
    `"ytsearch${limit * 2}:${searchQuery}"`,
    "--flat-playlist",
    "--print-json",
    "--no-warnings",
    "--skip-download",
    "--max-downloads", String(limit * 2),
    "2>/dev/null || true",
  ].join(" ");

  const result = await sshExec(cmd, { timeoutMs: 60_000 });
  if (result.code !== 0 && !result.stdout) {
    throw new Error(`yt-dlp discovery failed: ${result.stderr}`);
  }

  const videos: DiscoveredVideo[] = [];
  const lines = result.stdout.split("\n").filter(Boolean);

  for (const line of lines) {
    try {
      const data = JSON.parse(line) as Record<string, unknown>;
      const videoId = String(data.id || "");
      const title = String(data.title || "");
      const duration = Number(data.duration || 0);
      const channel = String(data.channel || data.uploader || "");
      const thumbnail = data.thumbnail ? String(data.thumbnail) : undefined;
      const viewCount = data.view_count ? Number(data.view_count) : undefined;

      if (!videoId || !title) continue;
      if (duration < minDuration || duration > maxDuration) continue;

      const titleLower = title.toLowerCase();
      const matchKeyword = keywords.some((kw) => titleLower.includes(kw));
      if (!matchKeyword) continue;

      videos.push({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        title,
        channel,
        durationSec: duration,
        thumbnail,
        viewCount,
      });

      if (videos.length >= limit) break;
    } catch {
      // skip malformed lines
    }
  }

  return videos;
}

/**
 * Fetch full metadata + heatmap for a single YouTube URL.
 */
export async function fetchVideoMetadata(url: string): Promise<{
  videoId: string;
  title: string;
  channel: string;
  durationSec: number;
  description: string;
  thumbnail?: string;
  heatmap?: Array<{ startSec: number; endSec: number; value: number }>;
  subtitleUrl?: string;
} | null> {
  const cmd = `yt-dlp --print-json --skip-download --no-warnings --sub-lang id,en --write-auto-subs ${shellQuote(url)} 2>/dev/null`;
  const result = await sshExec(cmd, { timeoutMs: 60_000 });
  if (result.code !== 0 || !result.stdout) return null;

  try {
    const data = JSON.parse(result.stdout) as Record<string, unknown>;
    const heatmapRaw = data.heatmap as Array<{ start_time: number; end_time: number; value: number }> | undefined;
    const heatmap = Array.isArray(heatmapRaw)
      ? heatmapRaw.map((h) => ({
          startSec: Number(h.start_time),
          endSec: Number(h.end_time),
          value: Number(h.value),
        }))
      : undefined;

    return {
      videoId: String(data.id || ""),
      title: String(data.title || ""),
      channel: String(data.channel || data.uploader || ""),
      durationSec: Number(data.duration || 0),
      description: String(data.description || ""),
      thumbnail: data.thumbnail ? String(data.thumbnail) : undefined,
      heatmap,
    };
  } catch {
    return null;
  }
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}
