import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12_000;
const MAX_FIELD_LENGTHS = {
  driveFileId: 200,
  title: 100,
  description: 5_000,
  tags: 500,
  category: 20,
  privacy: 20,
  schedule: 100,
};

function assertConfig() {
  if (!process.env.GAS_WEB_APP_URL) throw new Error("Missing GAS_WEB_APP_URL");
  if (!process.env.GAS_WEBHOOK_SECRET) throw new Error("Missing GAS_WEBHOOK_SECRET");
  if (!process.env.ADMIN_API_TOKEN) throw new Error("Missing ADMIN_API_TOKEN");
}

function assertAdmin(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function cleanPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Payload invalid");
  const raw = payload as Record<string, unknown>;
  const item = {
    driveFileId: String(raw.driveFileId ?? "").trim(),
    title: String(raw.title ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    tags: String(raw.tags ?? "").trim(),
    category: String(raw.category ?? "22").trim(),
    privacy: String(raw.privacy ?? "private").trim(),
    schedule: String(raw.schedule ?? "").trim(),
  };
  Object.entries(MAX_FIELD_LENGTHS).forEach(([key, max]) => {
    if (item[key as keyof typeof item].length > max) throw new Error(`${key} too long`);
  });
  if (!item.driveFileId) throw new Error("Drive File ID wajib diisi");
  if (!item.title) throw new Error("Judul wajib diisi");
  if (!item.schedule || Number.isNaN(new Date(item.schedule).getTime())) throw new Error("Jadwal invalid");
  if (!/^[-\w]{10,200}$/.test(item.driveFileId)) throw new Error("Drive File ID invalid");
  if (!/^[0-9]{1,3}$/.test(item.category)) throw new Error("Kategori invalid");
  if (!["private", "unlisted", "public"].includes(item.privacy)) throw new Error("Privacy invalid");
  return item;
}

async function parseJson(request: NextRequest) {
  const text = await request.text();
  const size = new TextEncoder().encode(text).byteLength;
  if (size > MAX_BODY_BYTES) throw new Error("Payload too large");
  return JSON.parse(text);
}

function publicError(message = "Request failed", status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    assertConfig();
    const unauthorized = assertAdmin(request);
    if (unauthorized) return unauthorized;
    const response = await fetch(process.env.GAS_WEB_APP_URL as string, {
      cache: "no-store",
      headers: { "x-gas-secret": process.env.GAS_WEBHOOK_SECRET as string },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error("Queue fetch failed", error);
    return publicError("Queue fetch failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertConfig();
    const unauthorized = assertAdmin(request);
    if (unauthorized) return unauthorized;
    const payload = cleanPayload(await parseJson(request));
    const response = await fetch(process.env.GAS_WEB_APP_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "x-gas-secret": process.env.GAS_WEBHOOK_SECRET as string,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Queue submit failed";
    const isBadRequest = message.includes("invalid") || message.includes("wajib") || message.includes("too long") || message.includes("too large");
    if (isBadRequest) return publicError(message, 400);
    console.error("Queue submit failed", error);
    return publicError("Queue submit failed");
  }
}
