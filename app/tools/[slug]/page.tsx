import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug } from "@/lib/tools/registry";
import type { Metadata } from "next";
import { ToolRunner } from "./tool-runner";
import { TtsRunner } from "./tts-runner";
import { RedirectCard } from "./redirect-card";

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
        </div>
      </div>
    </div>
  );
}

const toolPageCss = `
.tool-page-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #080b14;
  color: #e0e0e0;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.tool-page-root * { box-sizing: border-box; }
.tp-container {
  max-width: 920px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}
.tp-breadcrumb {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}
.tp-breadcrumb a {
  color: #facc15;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;
}
.tp-breadcrumb a:hover { opacity: 0.75; }
.tp-cat {
  padding: 4px 12px;
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  border-radius: 100px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: #facc15;
}

.tp-header {
  text-align: center;
  margin-bottom: 2.5rem;
  position: relative;
}
.tp-emoji {
  font-size: 4rem;
  margin-bottom: 0.6rem;
  filter: drop-shadow(0 4px 16px rgba(250, 204, 21, 0.3));
}
.tp-title {
  font-size: 2.4rem;
  font-weight: 800;
  margin: 0 0 0.5rem;
  background: linear-gradient(180deg, #ffe066 0%, #facc15 50%, #d4a017 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}
.tp-desc {
  color: rgba(255,255,255,0.7);
  font-size: 1.05rem;
  max-width: 640px;
  margin: 0 auto;
  line-height: 1.5;
}
.tp-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  border-radius: 100px;
  letter-spacing: 1.5px;
}
.tp-badge-new {
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #000;
}
.tp-badge-beta {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
}

.tp-card {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.tp-form-field {
  margin-bottom: 1.4rem;
}
.tp-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.3px;
}
.tp-required { color: #ef4444; margin-left: 4px; }
.tp-input,
.tp-textarea,
.tp-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.2s, background 0.2s;
}
.tp-input:focus,
.tp-textarea:focus,
.tp-select:focus {
  outline: none;
  border-color: rgba(250, 204, 21, 0.5);
  background: rgba(250, 204, 21, 0.04);
}
.tp-textarea { min-height: 90px; resize: vertical; line-height: 1.5; }
.tp-help {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
}

.tp-actions {
  display: flex;
  gap: 0.8rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}
.tp-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #000;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 8px 20px rgba(250, 204, 21, 0.3);
}
.tp-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(250, 204, 21, 0.45);
}
.tp-btn:active:not(:disabled) { transform: translateY(0); }
.tp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.tp-btn-secondary {
  background: rgba(255,255,255,0.06);
  color: #e0e0e0;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: none;
}
.tp-btn-secondary:hover:not(:disabled) {
  background: rgba(255,255,255,0.1);
  box-shadow: none;
  transform: translateY(-1px);
}

.tp-output {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.tp-output-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.tp-output-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #facc15;
}
.tp-output-meta {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
}
.tp-output-body {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1.4rem;
  white-space: pre-wrap;
  font-size: 0.92rem;
  line-height: 1.6;
  color: rgba(255,255,255,0.92);
  font-family: 'SFMono-Regular', Consolas, 'Courier New', monospace;
  max-height: 600px;
  overflow-y: auto;
}

.tp-error {
  margin-top: 1rem;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 0.9rem;
}

.tp-loading {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.tp-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000;
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
  padding: 16px 32px;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #000;
  border-radius: 12px;
  font-weight: 800;
  text-decoration: none;
  margin: 1rem 0;
  box-shadow: 0 8px 20px rgba(250, 204, 21, 0.3);
}
.tp-redirect-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(250, 204, 21, 0.45);
}
.tp-redirect-desc {
  color: rgba(255,255,255,0.7);
  font-size: 0.95rem;
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.5;
}

.tp-audio {
  width: 100%;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .tp-container { padding: 1.5rem 1rem 3rem; }
  .tp-title { font-size: 1.8rem; }
  .tp-emoji { font-size: 3rem; }
  .tp-card { padding: 1.4rem; border-radius: 16px; }
  .tp-actions { flex-direction: column; }
  .tp-btn { width: 100%; }
}
`;
