import "server-only";
import { Client, type ConnectConfig } from "ssh2";

type ExecResult = { stdout: string; stderr: string; code: number | null };

function buildAuth(): ConnectConfig {
  const host = process.env.SSH_HOST;
  const username = process.env.SSH_USER;
  if (!host) throw new Error("Missing SSH_HOST");
  if (!username) throw new Error("Missing SSH_USER");
  const port = Number(process.env.SSH_PORT ?? "22");

  const config: ConnectConfig = {
    host,
    port,
    username,
    readyTimeout: Number(process.env.SSH_READY_TIMEOUT_MS ?? "20000"),
    keepaliveInterval: 10_000,
  };

  if (process.env.SSH_PRIVATE_KEY) {
    config.privateKey = process.env.SSH_PRIVATE_KEY.replace(/\\n/g, "\n");
    if (process.env.SSH_PRIVATE_KEY_PASSPHRASE) {
      config.passphrase = process.env.SSH_PRIVATE_KEY_PASSPHRASE;
    }
  } else if (process.env.SSH_PRIVATE_KEY_B64) {
    config.privateKey = Buffer.from(process.env.SSH_PRIVATE_KEY_B64, "base64");
    if (process.env.SSH_PRIVATE_KEY_PASSPHRASE) {
      config.passphrase = process.env.SSH_PRIVATE_KEY_PASSPHRASE;
    }
  } else if (process.env.SSH_PASSWORD) {
    config.password = process.env.SSH_PASSWORD;
  } else {
    throw new Error("Missing SSH_PRIVATE_KEY or SSH_PRIVATE_KEY_B64 or SSH_PASSWORD");
  }

  return config;
}

function connect(): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = new Client();
    const config = buildAuth();
    client.once("ready", () => resolve(client));
    client.once("error", reject);
    client.connect(config);
  });
}

export async function sshExec(command: string, opts: { timeoutMs?: number } = {}): Promise<ExecResult> {
  const timeoutMs = opts.timeoutMs ?? 8 * 60_000;
  const client = await connect();
  try {
    return await new Promise<ExecResult>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      client.exec(command, (err, stream) => {
        if (err) return reject(err);
        let stdout = "";
        let stderr = "";
        const MAX_BUFFER = 2 * 1024 * 1024;
        timer = setTimeout(() => {
          stream.destroy();
          reject(new Error(`SSH command timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        stream
          .on("close", (code: number | null) => {
            if (timer) clearTimeout(timer);
            resolve({ stdout, stderr, code });
          })
          .on("data", (chunk: Buffer) => {
            if (stdout.length < MAX_BUFFER) stdout += chunk.toString("utf8");
          })
          .stderr.on("data", (chunk: Buffer) => {
            if (stderr.length < MAX_BUFFER) stderr += chunk.toString("utf8");
          });
      });
    });
  } finally {
    client.end();
  }
}

export async function sshPutFile(remotePath: string, content: string | Buffer): Promise<void> {
  const client = await connect();
  try {
    await new Promise<void>((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err);
        const stream = sftp.createWriteStream(remotePath);
        stream.on("close", () => resolve());
        stream.on("error", reject);
        stream.end(content);
      });
    });
  } finally {
    client.end();
  }
}

/**
 * Stream a remote file via SFTP back as a Web ReadableStream.
 * The SSH client is closed automatically when the stream ends or errors.
 */
export async function sftpReadStream(remotePath: string): Promise<ReadableStream<Uint8Array>> {
  const client = await connect();
  const sftp = await new Promise<import("ssh2").SFTPWrapper>((resolve, reject) => {
    client.sftp((err, s) => (err ? reject(err) : resolve(s)));
  });

  // Verify file exists & get size first (throws ENOENT if missing)
  await new Promise<void>((resolve, reject) => {
    sftp.stat(remotePath, (err) => (err ? reject(err) : resolve()));
  });

  const remoteStream = sftp.createReadStream(remotePath);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      remoteStream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      remoteStream.on("end", () => {
        controller.close();
        client.end();
      });
      remoteStream.on("error", (err: Error) => {
        controller.error(err);
        client.end();
      });
    },
    cancel() {
      remoteStream.destroy();
      client.end();
    },
  });
}

// Strict shell-arg quoting (single-quote escape)
export function shq(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function assertSafeFilename(name: string) {
  // Allow UUIDs (with dashes), alphanum, dot, underscore. Max 128 chars.
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(name)) throw new Error("Unsafe filename");
  if (name.includes("..")) throw new Error("Unsafe filename");
  return name;
}

export function sshConfig() {
  return {
    host: process.env.SSH_HOST,
    port: Number(process.env.SSH_PORT ?? "22"),
    user: process.env.SSH_USER,
  };
}

/**
 * Render a placeholder MP4 on the remote worker host via ffmpeg.
 * Returns the absolute remote path of the produced file.
 */
export async function renderRemoteVideo(jobId: string, title: string): Promise<string> {
  if (!/^[0-9a-f-]{8,64}$/i.test(jobId)) throw new Error("Invalid job id");
  const remoteDir = (process.env.WORKER_REMOTE_DIR ?? "~/sibermas-worker/output").replace(/[`$"\\]/g, "");
  const safeTitle = title
    .replace(/[\r\n]/g, " ")
    .replace(/'/g, "")
    .replace(/[`$"\\]/g, "")
    .slice(0, 80);
  const fileName = `${jobId}.mp4`;
  const remotePath = `${remoteDir}/${fileName}`;
  const drawText = `SIBERMAS-YT\\n${safeTitle}`;

  const cmd = [
    `mkdir -p ${shq(remoteDir)}`,
    `ffmpeg -y -f lavfi -i color=c=0x0f172a:s=1280x720:d=12 -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -vf "drawtext=text='${drawText}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.35:boxborderw=24" -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac ${shq(remotePath)} 2>&1 | tail -20`,
  ].join(" && ");

  const result = await sshExec(cmd, { timeoutMs: 180_000 });
  if (result.code !== 0) {
    throw new Error(`Remote render failed (code ${result.code}): ${result.stderr || result.stdout || "unknown"}`);
  }
  return remotePath;
}

/**
 * Build a public URL for the rendered video assuming the remote worker
 * exposes its output dir over HTTPS (e.g. via nginx static serve).
 */
export function publicVideoUrl(jobId: string): string {
  const base = process.env.WORKER_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Missing WORKER_PUBLIC_BASE_URL");
  return `${base}/${jobId}.mp4`;
}
