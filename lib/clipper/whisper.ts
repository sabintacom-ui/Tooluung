import "server-only";
import { sshExec } from "../remote/ssh";

const WHISPER_PYTHON = process.env.WHISPER_PYTHON || "/home/rizqunaid/clipper-venv/bin/python";
const WHISPER_MODEL = process.env.WHISPER_MODEL || "tiny";
const WHISPER_LANGUAGE = process.env.WHISPER_LANGUAGE || "id";
const CLIPPER_WORK_DIR = process.env.CLIPPER_WORK_DIR || "/home/rizqunaid/sibermas-worker/clipper";

function shq(value: string): string {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

/**
 * Transcribe an audio/video file via faster-whisper. Returns SRT path on server.
 * Heavy CPU operation: ~1-2x realtime on tiny model.
 */
export async function transcribeToSrt(input: {
  remoteInputPath: string;
  outBaseName: string;
  language?: string;
  model?: string;
}): Promise<{ remoteSrtPath: string }> {
  const { remoteInputPath, outBaseName } = input;
  const language = input.language || WHISPER_LANGUAGE;
  const model = input.model || WHISPER_MODEL;
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(outBaseName)) throw new Error("Invalid outBaseName");

  const outDir = `${CLIPPER_WORK_DIR}/whisper`;
  const srtPath = `${outDir}/${outBaseName}.srt`;
  const script = `
import sys, os
from faster_whisper import WhisperModel

infile = sys.argv[1]
outsrt = sys.argv[2]
lang = sys.argv[3]
modelname = sys.argv[4]

model = WhisperModel(modelname, device="cpu", compute_type="int8")
segments, info = model.transcribe(infile, language=lang, beam_size=1, vad_filter=True)

def fmt(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t - h*3600 - m*60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

with open(outsrt, "w", encoding="utf-8") as f:
    for i, seg in enumerate(segments, 1):
        f.write(f"{i}\\n{fmt(seg.start)} --> {fmt(seg.end)}\\n{seg.text.strip()}\\n\\n")
print("OK")
`.trim();

  const scriptPath = `${outDir}/_run_${outBaseName}.py`;
  const scriptB64 = Buffer.from(script).toString("base64");
  const cmd = [
    `mkdir -p ${shq(outDir)}`,
    `echo ${shq(scriptB64)} | base64 -d > ${shq(scriptPath)}`,
    `${WHISPER_PYTHON} ${shq(scriptPath)} ${shq(remoteInputPath)} ${shq(srtPath)} ${shq(language)} ${shq(model)} 2>&1 | tail -5`,
    `rm -f ${shq(scriptPath)}`,
  ].join(" && ");

  const result = await sshExec(cmd, { timeoutMs: 600_000 });
  if (result.code !== 0) {
    throw new Error(`faster-whisper failed (${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }
  // Verify file exists
  const check = await sshExec(`test -s ${shq(srtPath)} && echo OK || echo MISS`, { timeoutMs: 10_000 });
  if (check.stdout.trim() !== "OK") {
    throw new Error("faster-whisper completed but SRT file is empty/missing");
  }
  return { remoteSrtPath: srtPath };
}

/** Read SRT file content from server. */
export async function readSrt(remotePath: string): Promise<string> {
  const result = await sshExec(`cat ${shq(remotePath)}`, { timeoutMs: 30_000 });
  if (result.code !== 0) throw new Error(`Read SRT failed: ${result.stderr}`);
  return result.stdout;
}
