import { NextResponse } from "next/server";
import { getToolBySlug } from "@/lib/tools/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VOICE_MAP: Record<string, string> = {
  // Free-tier accessible voices (work without paid subscription)
  rachel: "9BWtsMINqrJLrRacOk9x", // Aria - female warm
  domi: "EXAVITQu4vr4xnSDxMaL", // Sarah - female soft
  bella: "9BWtsMINqrJLrRacOk9x", // Aria fallback
  antoni: "CwhRBWXzGAHq8TQ4Fs17", // Roger - male confident
  josh: "onwK4e9ZLuTAKqWW03F9", // Daniel - male deep
  adam: "IKne3meq5aSn9XLyUdCD", // Charlie - male natural
  sam: "CwhRBWXzGAHq8TQ4Fs17", // Roger fallback
};

export async function POST(req: Request) {
  let body: { slug?: string; input?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body.slug) return NextResponse.json({ ok: false, error: "slug_required" }, { status: 400 });

  const tool = getToolBySlug(body.slug);
  if (!tool) return NextResponse.json({ ok: false, error: "tool_not_found" }, { status: 404 });
  if (tool.config.kind !== "tts") {
    return NextResponse.json({ ok: false, error: "tool_not_tts" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "elevenlabs_api_key_missing" }, { status: 503 });
  }

  const input = body.input || {};
  const text = String(input.text || "").trim();
  if (!text) return NextResponse.json({ ok: false, error: "text_required" }, { status: 400 });
  if (text.length > 2500) {
    return NextResponse.json({ ok: false, error: "text_too_long_max_2500" }, { status: 400 });
  }

  const voiceKey = String(input.voice || "rachel");
  const voiceId =
    tool.config.voiceId || VOICE_MAP[voiceKey] || VOICE_MAP.rachel;
  const stability = Number(input.stability ?? "0.5");

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: tool.config.modelId || "eleven_multilingual_v2",
          voice_settings: {
            stability,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { ok: false, error: `elevenlabs_error_${response.status}`, detail: errText.slice(0, 500) },
        { status: 500 },
      );
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="sibermas-tts-${Date.now()}.mp3"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
