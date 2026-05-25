import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { getGoogleAccessToken, getYouTubeChannel } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = assertAdmin(request);
    if (unauthorized) return unauthorized;
    const token = await getGoogleAccessToken();
    const channel = await getYouTubeChannel();
    return NextResponse.json({
      ok: true,
      token: { tokenType: token.token_type, expiresIn: token.expires_in, scope: token.scope },
      channel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube status failed";
    console.error("YouTube status failed", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
