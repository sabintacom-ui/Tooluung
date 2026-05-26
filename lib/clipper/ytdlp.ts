import "server-only";
import { sshExec } from "../remote/ssh";

const YTDLP_BIN = process.env.YTDLP_BIN || "/home/rizqunaid/.local/bin/yt-dlp";
const CLIPPER_WORK_DIR = process.env.CLIPPER_WORK_DIR || "/home/rizqunaid/sibermas-worker/clipper";

export type YtdlpVideoInfo = {
  id: string;
  title: string;
  channel: string;
  channel_url: string;
  duration: number;
  view_count: number;
  thumbnail: string;
  description: string;
  webpage_url: string;
  heatmap?: Array<{ start_time: number; end_time: number; value: number }>;
  chapters?: Array<{ start_time: number; end_time: number; title: string }>;
  subtitles?: Record<string, Array<{ url: string; ext: string }>>;
  automatic_captions?: Record<string, Array<{ url: string; ext: string }>>;
};

function shq(value: string): string {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

/** Run yt-dlp with --dump-single-json to get rich metadata including heatmap. */
export async function getVideoInfo(url: string): Promise<YtdlpVideoInfo> {
  const safeUrl = url.trim();
  if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(safeUrl)) {
    throw new Error("Invalid YouTube URL");
  }
  const cmd = `${YTDLP_BIN} --dump-single-json --no-warnings --skip-download ${shq(safeUrl)}`;
  const result = await sshExec(cmd, { timeoutMs: 60_000 });
  if (result.code !== 0) {
    throw new Error(`yt-dlp failed (${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }
  try {
    const info = JSON.parse(result.stdout) as YtdlpVideoInfo;
    return info;
  } catch (error) {
    throw new Error(`yt-dlp returned non-JSON: ${(error as Error).message}`);
  }
}

/** Scrape trending videos from YouTube Indonesia (or specific feed/playlist URL). */
export async function getTrending(opts?: {
  feedUrl?: string;
  region?: string;
  maxItems?: number;
}): Promise<Array<{ id: string; title: string; duration?: number; channel?: string; url: string }>> {
  const region = opts?.region || "ID";
  const max = opts?.maxItems ?? 50;
  // Default to general trending feed for ID; could also use category-specific feeds.
  const feed = opts?.feedUrl || `https://www.youtube.com/feed/trending?gl=${region}`;
  const cmd = `${YTDLP_BIN} --flat-playlist --no-warnings --print "%(id)s|%(title)s|%(duration)s|%(channel)s|%(url)s" --playlist-end ${max} ${shq(feed)}`;
  const result = await sshExec(cmd, { timeoutMs: 90_000 });
  if (result.code !== 0) {
    throw new Error(`yt-dlp trending failed (${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("WARNING") && !line.startsWith("ERROR"))
    .map((line) => {
      const [id, title, duration, channel, url] = line.split("|");
      return {
        id: String(id || "").trim(),
        title: String(title || "").trim(),
        duration: duration && duration !== "NA" ? Number(duration) : undefined,
        channel: String(channel || "").trim(),
        url: String(url || `https://www.youtube.com/watch?v=${id}`).trim(),
      };
    })
    .filter((item) => item.id.length > 0);
}

/** Search YouTube via yt-dlp ytsearch with keyword. */
export async function search(query: string, maxItems = 30): Promise<Array<{ id: string; title: string; duration?: number; channel?: string; url: string }>> {
  const safe = query.replace(/[^\w\s\-]/g, " ").trim();
  if (!safe) throw new Error("Empty query");
  const cmd = `${YTDLP_BIN} --flat-playlist --no-warnings --print "%(id)s|%(title)s|%(duration)s|%(channel)s|%(url)s" ${shq(`ytsearch${maxItems}:${safe}`)}`;
  const result = await sshExec(cmd, { timeoutMs: 60_000 });
  if (result.code !== 0) {
    throw new Error(`yt-dlp search failed (${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|"))
    .map((line) => {
      const [id, title, duration, channel, url] = line.split("|");
      return {
        id: String(id || "").trim(),
        title: String(title || "").trim(),
        duration: duration && duration !== "NA" ? Number(duration) : undefined,
        channel: String(channel || "").trim(),
        url: String(url || `https://www.youtube.com/watch?v=${id}`).trim(),
      };
    })
    .filter((item) => item.id.length > 0);
}

/** Download a specific segment of the video (start/end in seconds) to local MP4. */
export async function downloadSegment(input: {
  videoId: string;
  url: string;
  startSec: number;
  endSec: number;
}): Promise<{ remotePath: string; fileName: string }> {
  const { videoId, url, startSec, endSec } = input;
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) throw new Error("Invalid videoId");
  if (!(startSec >= 0 && endSec > startSec)) throw new Error("Invalid time range");
  const fileName = `${videoId}_${Math.floor(startSec)}-${Math.floor(endSec)}.mp4`;
  const outPath = `${CLIPPER_WORK_DIR}/raw/${fileName}`;
  const startStr = startSec.toFixed(2);
  const endStr = endSec.toFixed(2);
  const cmd = [
    `mkdir -p ${shq(`${CLIPPER_WORK_DIR}/raw`)}`,
    `${YTDLP_BIN} --no-warnings --no-progress \
      --download-sections "*${startStr}-${endStr}" \
      --force-keyframes-at-cuts \
      -f "bv*[height<=1080]+ba/b[height<=1080]" \
      --merge-output-format mp4 \
      -o ${shq(outPath)} \
      ${shq(url)} 2>&1 | tail -15`,
  ].join(" && ");
  const result = await sshExec(cmd, { timeoutMs: 300_000 });
  if (result.code !== 0) {
    throw new Error(`yt-dlp download failed (${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }
  return { remotePath: outPath, fileName };
}

/** Download VTT/SRT subtitle for the source video (manual or auto). */
export async function downloadSubtitle(input: {
  videoId: string;
  url: string;
  language?: string;
}): Promise<{ remotePath: string } | null> {
  const { videoId, url, language = "id" } = input;
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) throw new Error("Invalid videoId");
  const baseName = `${videoId}_sub`;
  const outBase = `${CLIPPER_WORK_DIR}/subs/${baseName}`;
  const cmd = [
    `mkdir -p ${shq(`${CLIPPER_WORK_DIR}/subs`)}`,
    `${YTDLP_BIN} --no-warnings --no-progress --skip-download \
      --write-auto-subs --write-subs \
      --sub-langs "${language},${language}-orig,en" \
      --sub-format "srt/vtt/best" \
      --convert-subs srt \
      -o ${shq(outBase)} \
      ${shq(url)} 2>&1 | tail -5`,
  ].join(" && ");
  const result = await sshExec(cmd, { timeoutMs: 60_000 });
  if (result.code !== 0) {
    // Non-fatal: caller can fallback to whisper transcribe
    return null;
  }
  // yt-dlp picks output suffix from selected lang. Try common patterns.
  const candidates = [
    `${outBase}.${language}.srt`,
    `${outBase}.${language}-orig.srt`,
    `${outBase}.en.srt`,
  ];
  for (const path of candidates) {
    const check = await sshExec(`test -s ${shq(path)} && echo OK || echo MISS`, { timeoutMs: 10_000 });
    if (check.stdout.trim() === "OK") {
      return { remotePath: path };
    }
  }
  return null;
}
