import { NextResponse } from "next/server";
import { getToolBySlug } from "@/lib/tools/registry";
import { snifoxChat } from "@/lib/ai/snifox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  if (tool.config.kind !== "llm") {
    return NextResponse.json(
      { ok: false, error: `tool_kind_${tool.config.kind}_not_runnable_here` },
      { status: 400 },
    );
  }

  const input = body.input || {};
  // Validate required fields
  for (const field of tool.fields) {
    if (field.required && !String(input[field.name] || "").trim()) {
      return NextResponse.json(
        { ok: false, error: `missing_required_field`, field: field.name, label: field.label },
        { status: 400 },
      );
    }
  }
  // Apply defaults
  const merged: Record<string, string> = {};
  for (const field of tool.fields) {
    merged[field.name] = String(input[field.name] ?? field.default ?? "");
  }

  try {
    const userPrompt = tool.config.buildUserPrompt(merged);
    const result = await snifoxChat({
      model: tool.config.model,
      messages: [
        { role: "system", content: tool.config.systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: tool.config.temperature ?? 0.7,
      maxTokens: tool.config.maxTokens ?? 2500,
      responseFormat: tool.config.responseFormat,
    });
    return NextResponse.json({
      ok: true,
      content: result.content,
      tokens: result.tokens,
      model: result.model,
      outputType: tool.config.outputType ?? "markdown",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
