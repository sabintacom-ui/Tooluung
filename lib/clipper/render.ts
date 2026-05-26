import "server-only";
import { assertSafeFilename, sshExec } from "../remote/ssh";

const CLIPPER_WORK_DIR = process.env.CLIPPER_WORK_DIR || "/home/rizqunaid/sibermas-worker/clipper";
const CLIPPER_PUBLIC_BASE =
  process.env.CLIPPER_PUBLIC_BASE_URL || "https://sibermas.rizquna.id/generated/clipper";
const BRAND_NAME = process.env.CLIPPER_BRAND_NAME || "Sibermas UIN SAIZU";

function shq(value: string): string {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function sanitizeForDrawtext(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 80);
}

/**
 * Render a vertical 9:16 short from a raw clip MP4 + SRT subtitles.
 * - Center-crop to 1080x1920
 * - Burn-in subtitles bottom area (ASS style)
 * - Add top headline (hookText) optional
 * - Add bottom attribution / branding watermark
 */
export async function renderVerticalShort(input: {
  rawClipPath: string;
  srtPath?: string;
  outFileName: string;
  hookText?: string;
  sourceChannel?: string;
}): Promise<{ remotePath: string; publicUrl: string; fileName: string }> {
  const outFileName = assertSafeFilename(input.outFileName);
  const outDir = `${CLIPPER_WORK_DIR}/out`;
  const outPath = `${outDir}/${outFileName}`;

  const hook = input.hookText ? sanitizeForDrawtext(input.hookText) : "";
  const channel = input.sourceChannel ? sanitizeForDrawtext(`Source: ${input.sourceChannel}`) : "";
  const brand = sanitizeForDrawtext(BRAND_NAME);

  // Build filter_complex: blur-pad style (foreground centered, blurred background fills 9:16).
  // 1) bg: scale-cover to 1080x1920 + heavy blur
  // 2) fg: scale-fit to fit within 1080x1920 (preserves all content)
  // 3) overlay fg on bg, centered
  // 4) optional subtitles burn-in
  // 5) optional drawtext (hook top, brand bottom-left, channel bottom-right)
  const fcChain: string[] = [];
  fcChain.push("[0:v]split=2[bgsrc][fgsrc]");
  fcChain.push(
    "[bgsrc]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=30[bg]",
  );
  fcChain.push(
    "[fgsrc]scale=1080:1920:force_original_aspect_ratio=decrease[fg]",
  );

  let lastLabel = "[v0]";
  fcChain.push(`[bg][fg]overlay=(W-w)/2:(H-h)/2${lastLabel}`);

  if (input.srtPath) {
    const srtEsc = input.srtPath.replace(/\\/g, "\\\\\\\\").replace(/'/g, "\\\\'").replace(/:/g, "\\\\:");
    const next = "[v1]";
    fcChain.push(
      `${lastLabel}subtitles='${srtEsc}':force_style='Fontname=Sans,Fontsize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=240'${next}`,
    );
    lastLabel = next;
  }
  if (hook) {
    const next = "[v2]";
    fcChain.push(
      `${lastLabel}drawtext=text='${hook}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=120:box=1:boxcolor=black@0.55:boxborderw=20${next}`,
    );
    lastLabel = next;
  }
  {
    const next = "[v3]";
    fcChain.push(
      `${lastLabel}drawtext=text='${brand}':fontcolor=white@0.85:fontsize=24:x=24:y=h-th-24:box=1:boxcolor=black@0.4:boxborderw=10${next}`,
    );
    lastLabel = next;
  }
  if (channel) {
    const next = "[v4]";
    fcChain.push(
      `${lastLabel}drawtext=text='${channel}':fontcolor=white@0.85:fontsize=20:x=w-text_w-24:y=h-th-24:box=1:boxcolor=black@0.4:boxborderw=10${next}`,
    );
    lastLabel = next;
  }
  const filterComplex = fcChain.join(";");

  const cmd = [
    `mkdir -p ${shq(outDir)}`,
    `ffmpeg -y -i ${shq(input.rawClipPath)} -filter_complex ${shq(filterComplex)} -map ${shq(lastLabel)} -map 0:a? -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -ar 44100 -movflags +faststart ${shq(outPath)} 2>&1 | tail -20`,
  ].join(" && ");

  const result = await sshExec(cmd, { timeoutMs: 600_000 });
  if (result.code !== 0) {
    throw new Error(`ffmpeg vertical render failed (${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }

  // Verify file
  const check = await sshExec(`test -s ${shq(outPath)} && stat -c %s ${shq(outPath)} || echo 0`, { timeoutMs: 10_000 });
  const size = Number(check.stdout.trim());
  if (!size || size < 1024) {
    throw new Error("Render produced empty file");
  }

  const publicUrl = `${CLIPPER_PUBLIC_BASE.replace(/\/$/, "")}/${outFileName}`;
  return { remotePath: outPath, publicUrl, fileName: outFileName };
}
