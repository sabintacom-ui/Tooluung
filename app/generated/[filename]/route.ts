import { NextRequest, NextResponse } from "next/server";
import { assertSafeFilename, sftpReadStream } from "@/lib/remote/ssh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow content-type mapping for media files
const MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  webm: "video/webm",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  txt: "text/plain; charset=utf-8",
};

const ALLOWED_EXTENSIONS = Object.keys(MIME_TYPES);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    assertSafeFilename(filename);

    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ ok: false, error: "Unsupported file type" }, { status: 400 });
    }

    const remoteDir = (process.env.WORKER_REMOTE_DIR ?? "~/sibermas-worker/output").replace(/[`$"\\;|&]/g, "");
    const remotePath = `${remoteDir}/${filename}`;

    const stream = await sftpReadStream(remotePath);

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": MIME_TYPES[ext],
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "File fetch failed";
    if (message.includes("Unsafe") || message.includes("Unsupported")) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    if (message.includes("No such file") || message.includes("ENOENT")) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    console.error("Generated file fetch failed", error);
    return NextResponse.json({ ok: false, error: "File fetch failed" }, { status: 500 });
  }
}
