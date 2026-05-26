import Link from "next/link";

type Props = {
  content: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export function InfoCard({ content, ctaLabel, ctaUrl }: Props) {
  // Simple markdown-to-html: convert headings, lists, code blocks, links
  const html = renderMarkdown(content);

  return (
    <div className="info-card">
      <div className="info-content" dangerouslySetInnerHTML={{ __html: html }} />
      {ctaLabel && ctaUrl ? (
        <div className="info-cta-wrap">
          {ctaUrl.startsWith("/") ? (
            <Link href={ctaUrl} className="info-cta">
              {ctaLabel}
            </Link>
          ) : (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="info-cta"
            >
              {ctaLabel}
            </a>
          )}
        </div>
      ) : null}
      <style>{infoCss}</style>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(md: string): string {
  let s = escapeHtml(md);
  // Code blocks
  s = s.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);
  // Inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Headings
  s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  s = s.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Lists
  s = s.replace(/^- (.+)$/gm, "<li>$1</li>");
  s = s.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  // Paragraphs (lines that are not in tags)
  s = s
    .split("\n\n")
    .map((p) => {
      if (/^<(h[1-6]|ul|pre|li)/.test(p.trim())) return p;
      if (!p.trim()) return "";
      return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
  return s;
}

const infoCss = `
.info-card {
  display: flex;
  flex-direction: column;
}
.info-content {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255,255,255,0.85);
}
.info-content h1 {
  font-size: 1.6rem;
  font-weight: 800;
  color: #facc15;
  margin: 0 0 1rem;
  letter-spacing: -0.01em;
}
.info-content h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #facc15;
  margin: 1.6rem 0 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.info-content h3 {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  margin: 1.2rem 0 0.5rem;
}
.info-content p {
  margin: 0 0 0.8rem;
  color: rgba(255,255,255,0.78);
}
.info-content ul {
  margin: 0 0 1rem;
  padding-left: 1.4rem;
}
.info-content li {
  margin-bottom: 0.4rem;
  color: rgba(255,255,255,0.78);
}
.info-content strong {
  color: rgba(255,255,255,0.98);
  font-weight: 700;
}
.info-content code {
  background: rgba(255,255,255,0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.85em;
  color: #facc15;
}
.info-content pre {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.8rem 0;
}
.info-content pre code {
  background: transparent;
  padding: 0;
  color: rgba(255,255,255,0.85);
  font-size: 0.85rem;
  line-height: 1.5;
}
.info-content a {
  color: #facc15;
  text-decoration: none;
  border-bottom: 1px dashed rgba(250,204,21,0.4);
}
.info-content a:hover {
  border-bottom-style: solid;
}

.info-cta-wrap {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.08);
  text-align: center;
}
.info-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 14px 32px;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #000;
  border-radius: 100px;
  font-weight: 800;
  font-size: 1rem;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba(250,204,21,0.3);
  transition: all 0.25s ease;
}
.info-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(250,204,21,0.45);
}
`;
