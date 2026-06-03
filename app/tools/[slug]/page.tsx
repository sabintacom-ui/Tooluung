import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools/registry";
import type { Metadata } from "next";
import { ToolRunner } from "./tool-runner";
import { TtsRunner } from "./tts-runner";
import { RedirectCard } from "./redirect-card";
import { InfoCard } from "./info-card";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool tidak ditemukan — Sibermas" };
  return {
    title: `${tool.label} — Sibermas Tools`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: Params) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const isLlm = tool.config.kind === "llm";
  const isTts = tool.config.kind === "tts";
  const isRedirect = tool.config.kind === "redirect";
  const isInfo = tool.config.kind === "info";

  return (
    <div className="tool-page-root">
      <style>{toolPageCss}</style>
      <div className="tp-container">
        <div className="tp-breadcrumb">
          <Link href="/tools">← Semua Tools</Link>
          <span className="tp-cat">{tool.category.toUpperCase()}</span>
        </div>

        <div className="tp-header">
          <div className="tp-emoji">{tool.emoji}</div>
          <h1 className="tp-title">{tool.label}</h1>
          <p className="tp-desc">{tool.description}</p>
          {tool.badge ? <div className={`tp-badge tp-badge-${tool.badge.toLowerCase()}`}>{tool.badge}</div> : null}
        </div>

        <div className="tp-card">
          {isLlm ? <ToolRunner tool={JSON.parse(JSON.stringify({ slug: tool.slug, fields: tool.fields }))} /> : null}
          {isTts ? <TtsRunner tool={JSON.parse(JSON.stringify({ slug: tool.slug, fields: tool.fields }))} /> : null}
          {isRedirect ? (
            <RedirectCard
              url={(tool.config as { url: string; description: string }).url}
              description={(tool.config as { url: string; description: string }).description}
            />
          ) : null}
          {isInfo ? (
            <InfoCard
              content={(tool.config as { content: string; ctaLabel?: string; ctaUrl?: string }).content}
              ctaLabel={(tool.config as { content: string; ctaLabel?: string; ctaUrl?: string }).ctaLabel}
              ctaUrl={(tool.config as { content: string; ctaLabel?: string; ctaUrl?: string }).ctaUrl}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const toolPageCss = `
:root {
  --bg: #030807;
  --bg-2: #051410;
  --gold: #fbbf24;
  --gold-soft: #fde68a;
  --gold-dark: #d4a017;
  --teal: #14b8a6;
  --teal-deep: #0f766e;
  --teal-glow: rgba(20, 184, 166, 0.35);
  --text: #f0fdf4;
  --text-muted: #94a3b8;
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: rgba(255, 255, 255, 0.06);
  --card-hover-border: rgba(20, 184, 166, 0.4);
}

.tool-page-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background:
    radial-gradient(1000px 600px at 50% -10%, rgba(20, 184, 166, 0.22), transparent 70%),
    radial-gradient(800px 500px at 10% 20%, rgba(251, 191, 36, 0.08), transparent 60%),
    radial-gradient(800px 500px at 90% 30%, rgba(56, 189, 248, 0.08), transparent 60%),
    var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  position: relative;
}

.tool-page-root::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at top, black, transparent 80%);
}

.tool-page-root * { box-sizing: border-box; }

.tp-container {
  max-width: 920px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
  position: relative;
  z-index: 1;
}

.tp-breadcrumb {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  font-size: 0.9rem;
}
.tp-breadcrumb a {
  color: var(--gold-soft);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}
.tp-breadcrumb a:hover { color: var(--gold); }
.tp-cat {
  padding: 5px 14px;
  background: rgba(20, 184, 166, 0.08);
  border: 1px solid rgba(20, 184, 166, 0.25);
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--teal);
}

.tp-header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}
.tp-emoji {
  font-size: 4.2rem;
  margin-bottom: 0.8rem;
  filter: drop-shadow(0 4px 20px rgba(20, 184, 166, 0.25));
}
.tp-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2.2rem, 5vw, 3rem);
  font-weight: 900;
  margin: 0 0 0.8rem;
  background: linear-gradient(180deg, #ffffff 30%, #a7f3d0 70%, var(--gold-soft));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.02em;
}
.tp-desc {
  color: var(--text-muted);
  font-size: 1.08rem;
  max-width: 680px;
  margin: 0 auto;
  line-height: 1.6;
}
.tp-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px 12px;
  font-size: 0.65rem;
  font-weight: 900;
  border-radius: 6px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.tp-badge-new {
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #02120e;
  box-shadow: 0 2px 10px rgba(250, 204, 21, 0.4);
}
.tp-badge-beta {
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #fff;
  box-shadow: 0 2px 10px rgba(56, 189, 248, 0.4);
}

.tp-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015));
  backdrop-filter: blur(24px);
  border: 1px solid var(--card-border);
  border-radius: 28px;
  padding: 2.5rem;
  box-shadow:
    0 25px 70px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.tp-form-field {
  margin-bottom: 1.6rem;
}
.tp-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.6rem;
  color: #e2e8f0;
  letter-spacing: 0.2px;
}
.tp-required { color: #ef4444; margin-left: 4px; }
.tp-input,
.tp-textarea,
.tp-select {
  width: 100%;
  padding: 14px 18px;
  background: rgba(2, 12, 9, 0.7);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
}
.tp-input:focus,
.tp-textarea:focus,
.tp-select:focus {
  border-color: rgba(20, 184, 166, 0.6);
  box-shadow:
    0 0 0 1px rgba(20, 184, 166, 0.6),
    0 0 16px rgba(20, 184, 166, 0.25);
  background: rgba(2, 12, 9, 0.95);
}
.tp-textarea { min-height: 100px; resize: vertical; line-height: 1.5; }
.tp-help {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.tp-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}
.tp-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, var(--teal), var(--teal-deep));
  color: #02120e;
  border: none;
  border-radius: 100px;
  font-weight: 800;
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.2s ease,
              filter 0.2s ease;
  box-shadow: 0 10px 30px rgba(20, 184, 166, 0.3);
}
.tp-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.12);
  box-shadow: 0 15px 40px rgba(20, 184, 166, 0.45), 0 0 15px var(--teal-glow);
}
.tp-btn:active:not(:disabled) { transform: translateY(0); }
.tp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.tp-btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
}
.tp-btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: none;
}

.tp-output {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.tp-output-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}
.tp-output-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--teal);
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.tp-output-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}
.tp-output-body {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.5rem;
  white-space: pre-wrap;
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  font-family: 'SFMono-Regular', Consolas, 'Courier New', monospace;
  max-height: 600px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(20, 184, 166, 0.3) rgba(0, 0, 0, 0.4);
}

.tp-error {
  margin-top: 1.2rem;
  padding: 14px 18px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 14px;
  color: #fca5a5;
  font-size: 0.9rem;
  line-height: 1.5;
}

.tp-loading {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}
.tp-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #02120e;
  border-radius: 50%;
  animation: tp-spin 0.6s linear infinite;
}
@keyframes tp-spin { to { transform: rotate(360deg); } }

.tp-redirect-card {
  text-align: center;
  padding: 1rem 0;
}
.tp-redirect-link {
  display: inline-block;
  padding: 16px 36px;
  background: linear-gradient(135deg, var(--teal), var(--teal-deep));
  color: #02120e;
  border-radius: 100px;
  font-weight: 800;
  text-decoration: none;
  margin: 1.2rem 0;
  box-shadow: 0 10px 30px rgba(20, 184, 166, 0.3);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, filter 0.2s ease;
}
.tp-redirect-link:hover {
  transform: translateY(-2px);
  filter: brightness(1.12);
  box-shadow: 0 15px 40px rgba(20, 184, 166, 0.45), 0 0 15px var(--teal-glow);
}
.tp-redirect-desc {
  color: var(--text-muted);
  font-size: 0.98rem;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.tp-audio {
  width: 100%;
  margin-top: 1.2rem;
  border-radius: 100px;
  outline: none;
}

@media (max-width: 768px) {
  .tp-container { padding: 2rem 1rem 4rem; }
  .tp-title { font-size: 2rem; }
  .tp-emoji { font-size: 3.5rem; }
  .tp-card { padding: 1.6rem; border-radius: 20px; }
  .tp-actions { flex-direction: column; gap: 12px; }
  .tp-btn { width: 100%; }
}
`;
