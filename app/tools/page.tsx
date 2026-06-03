import Link from "next/link";
import { ALL_TOOLS } from "@/lib/tools/registry";

// Force revalidation every 60 seconds
export const revalidate = 60;

export const metadata = {
  title: "Pusat Alat Konten Kreator — Sibermas UIN SAIZU",
  description:
    "47+ Tools AI internal untuk konten kreator dakwah & edukasi: Generator video, Clipper Shorts, SEO, Thumbnail, Voice, Music, dan lainnya — semua langsung di Sibermas.",
};

type FeaturedTool = {
  emoji: string;
  label: string;
  href: string;
  badge?: "NEW" | "BETA";
};

// Sibermas native (heavy backend pipeline tools)
const FEATURED: FeaturedTool[] = [
  { emoji: "🎬", label: "VIDEO GENERATOR", href: "/", badge: "NEW" },
  { emoji: "✂️", label: "CLIPPER SHORTS", href: "/clipper", badge: "NEW" },
];

// Group order for display
const CATEGORY_ORDER = [
  "konten",
  "dakwah",
  "islamic",
  "seo",
  "social",
  "produktivitas",
  "visual",
  "thumbnail",
  "suno",
  "music",
  "spoken",
  "audio",
  "utility",
];

const CATEGORY_LABEL: Record<string, string> = {
  konten: "📅 Konten & Planning",
  dakwah: "🕌 Konten Dakwah",
  islamic: "📿 Ibadah & Fiqih",
  seo: "🔍 SEO & YouTube",
  social: "📱 Social Media",
  produktivitas: "🚀 Produktivitas & Bisnis",
  visual: "🎨 Visual & Image",
  thumbnail: "📐 Thumbnail Studio",
  suno: "🎶 Suno / Music Lyric",
  music: "🎵 Music Production",
  spoken: "🗣️ Spoken Word",
  audio: "🎙️ Voice & Audio",
  utility: "🛠️ Utilities",
};

function ToolCard({
  href,
  emoji,
  label,
  badge,
  idx,
  external = false,
}: {
  href: string;
  emoji: string;
  label: string;
  badge?: string;
  idx: number;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="tool-emoji">{emoji}</span>
      <span className="tool-label">{label}</span>
      {badge ? <div className={`badge-${badge.toLowerCase()}`}>{badge}</div> : null}
    </>
  );
  const style = { animationDelay: `${Math.min(idx * 0.02, 0.6)}s` } as React.CSSProperties;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="tool-button" style={style}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className="tool-button" style={style}>
      {inner}
    </Link>
  );
}

export default function ToolsPage() {
  // Group registry tools by category
  const grouped = new Map<string, typeof ALL_TOOLS>();
  for (const tool of ALL_TOOLS) {
    const arr = grouped.get(tool.category) || [];
    arr.push(tool);
    grouped.set(tool.category, arr);
  }

  const totalTools = FEATURED.length + ALL_TOOLS.length;

  return (
    <div className="tools-root">
      <style>{toolsCss}</style>
      <div className="container">
        <div className="hero-section">
          <div className="hero-badge">
            <span className="badge-line" />
            <span className="dot" /> {totalTools}+ Tools AI Konten Kreator
            <span className="badge-line" />
          </div>
          <h1>Sibermas UIN SAIZU</h1>
          <div className="hero-subtitle">
            👑 Pusat <span className="gold">Alat</span> & Sumber Daya{" "}
            <span className="gold">Konten Kreator</span> Dakwah ⭐
          </div>
          <div className="hero-tagline-box">
            <p className="tagline-text">
              Bismillahirrahmanirrahim · Konten dakwah & edukasi dengan AI ⚡
            </p>
          </div>
          <div className="hero-admin-box">
            <div className="admin-item">
              <span className="admin-icon">🌐</span> sibermas.rizquna.id
            </div>
            <div className="admin-divider" />
            <div className="admin-item">
              <span className="admin-icon">🎯</span> Sibermas UIN SAIZU
            </div>
          </div>
          <div className="hero-line" />
          <div className="live-online-box">
            <span className="live-online-dot" />
            <span className="live-online-num">{totalTools}</span>
            <span className="live-online-label">Tools Tersedia</span>
          </div>
        </div>

        {/* Featured: Sibermas native pipelines */}
        <h2 className="section-title">⚡ Featured · Pipeline Otomatis</h2>
        <div className="button-grid">
          {FEATURED.map((tool, idx) => (
            <ToolCard key={tool.label} {...tool} idx={idx} />
          ))}
        </div>

        {/* Registry tools by category */}
        {CATEGORY_ORDER.map((cat) => {
          const tools = grouped.get(cat) || [];
          if (tools.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="section-title">{CATEGORY_LABEL[cat] || cat}</h2>
              <div className="button-grid">
                {tools.map((tool, idx) => (
                  <ToolCard
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    emoji={tool.emoji}
                    label={tool.label}
                    badge={tool.badge}
                    idx={idx}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ticker-wrapper">
        <div className="ticker-content">
          ✨ Sibermas Pusat Studi & Riset Cyber Mahasiswa UIN SAIZU Purwokerto · Konten Dakwah, Edukasi, dan Inovasi Mahasiswa · Hubungi admin via{" "}
          <a href="https://wa.me/6287884242420" target="_blank" rel="noreferrer">WhatsApp</a> atau{" "}
          <a href="https://uinsaizu.ac.id" target="_blank" rel="noreferrer">uinsaizu.ac.id</a>
        </div>
      </div>

      <div className="motivasi-quote">
        <p>&ldquo;Kerjakan Lebih, Jika Ingin Hasil Lebih&rdquo;</p>
        <span>By Sibermas UIN SAIZU</span>
      </div>

      <footer>
        <p>&copy; 2026 Sibermas UIN SAIZU. All rights reserved. | Lokasi: Purwokerto, Jawa Tengah</p>
      </footer>
    </div>
  );
}

const toolsCss = `
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

.tools-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background:
    radial-gradient(1000px 600px at 50% -10%, rgba(20, 184, 166, 0.22), transparent 70%),
    radial-gradient(800px 500px at 10% 20%, rgba(251, 191, 36, 0.08), transparent 60%),
    radial-gradient(800px 500px at 90% 30%, rgba(56, 189, 248, 0.08), transparent 60%),
    var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  position: relative;
}

.tools-root::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at top, black, transparent 80%);
}

.tools-root * { box-sizing: border-box; }

.tools-root .container {
  width: 100%;
  max-width: 1200px;
  padding: 2.5rem 2rem 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

/* === HERO === */
.tools-root .hero-section {
  text-align: center;
  padding: 4rem 2.5rem;
  margin-bottom: 2.5rem;
  width: 100%;
  position: relative;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20, 184, 166, 0.15), transparent 70%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.005));
  backdrop-filter: blur(40px) saturate(1.4);
  border-radius: 32px;
  border: 1px solid var(--card-border);
  box-shadow:
    0 30px 100px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tools-root .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 1.8rem;
  letter-spacing: 0.5px;
}
.tools-root .hero-badge .dot {
  width: 7px;
  height: 7px;
  background: var(--gold);
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
  box-shadow: 0 0 8px rgba(250, 204, 21, 0.8);
}
.tools-root .hero-badge .badge-line {
  width: 40px;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.5));
}
.tools-root .hero-badge .badge-line:last-child {
  background: linear-gradient(90deg, rgba(250, 204, 21, 0.5), transparent);
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.6); }
}

.tools-root h1 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2.5rem, 5.5vw, 4rem);
  font-weight: 900;
  background: linear-gradient(180deg, #ffffff 30%, #a7f3d0 70%, var(--gold-soft));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 1.2rem;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.3));
}

.tools-root .hero-subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 1.8rem;
  letter-spacing: 0.3px;
}
.tools-root .hero-subtitle .gold { color: var(--gold); font-weight: 700; }

.tools-root .hero-tagline-box,
.tools-root .hero-admin-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50px;
  margin-bottom: 1.2rem;
  width: fit-content;
  max-width: 90%;
  min-height: 52px;
}
.tools-root .hero-admin-box { gap: 0; margin-bottom: 1.5rem; }
.tools-root .tagline-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--gold-soft);
  margin: 0;
  font-family: 'Amiri', serif;
}
.tools-root .admin-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  padding: 0 16px;
}
.tools-root .admin-icon { font-size: 1.1rem; }
.tools-root .admin-divider { width: 1.5px; height: 20px; background: rgba(255, 255, 255, 0.12); }
.tools-root .hero-line {
  width: 120px;
  height: 1px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.4), transparent);
  opacity: 0.8;
}

.tools-root .live-online-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 1.2rem;
  padding: 9px 20px;
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 100px;
  backdrop-filter: blur(20px);
  font-size: 0.85rem;
  font-weight: 600;
}
.tools-root .live-online-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
  animation: live-pulse 1.6s ease-out infinite;
}
@keyframes live-pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55), 0 0 8px rgba(34, 197, 94, 0.8); }
  70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0), 0 0 8px rgba(34, 197, 94, 0.8); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0), 0 0 8px rgba(34, 197, 94, 0.8); }
}
.tools-root .live-online-num {
  min-width: 4ch;
  text-align: center;
  color: #4ade80;
  font-weight: 800;
  font-size: 1rem;
}
.tools-root .live-online-label { color: rgba(255, 255, 255, 0.8); font-weight: 500; }

/* === Section title === */
.tools-root .section-title {
  width: 100%;
  margin: 2.5rem 0 1.2rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.tools-root .section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.3), transparent);
  margin-left: 0.5rem;
}

/* === Button Grid === */
.tools-root .button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.2rem;
  width: 100%;
}
.tools-root .tool-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.8rem 1.4rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.005));
  backdrop-filter: blur(20px);
  color: var(--text);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.3s ease,
              background 0.3s ease,
              box-shadow 0.3s ease;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.02);
  position: relative;
  overflow: hidden;
  animation: cardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.tools-root .tool-button:hover {
  transform: translateY(-5px) scale(1.02);
  border-color: rgba(20, 184, 166, 0.4);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.35),
    0 0 15px rgba(20, 184, 166, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  background: linear-gradient(145deg, rgba(20, 184, 166, 0.08), rgba(255, 255, 255, 0.015));
}
.tools-root .tool-button:active { transform: translateY(-2px) scale(0.98); }

.tools-root .tool-emoji {
  font-size: 2.3rem;
  margin-bottom: 0.8rem;
  display: block;
  transition: transform 0.3s ease;
}
.tools-root .tool-button:hover .tool-emoji {
  transform: scale(1.15) rotate(3deg);
  filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.6));
}
.tools-root .tool-label {
  font-size: 0.98rem;
  line-height: 1.3;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
}

.tools-root .badge-new,
.tools-root .badge-beta {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 9px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-radius: 6px;
}
.tools-root .badge-new {
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #02120e;
  box-shadow: 0 2px 12px rgba(250, 204, 21, 0.4);
}
.tools-root .badge-beta {
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #fff;
  box-shadow: 0 2px 12px rgba(56, 189, 248, 0.4);
}

/* === TICKER === */
.tools-root .ticker-wrapper {
  width: 100%;
  background: rgba(3, 8, 7, 0.95);
  padding: 1rem 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.4);
  overflow: hidden;
  white-space: nowrap;
  margin-top: auto;
  position: relative;
  border-top: 1px solid rgba(20, 184, 166, 0.15);
}
.tools-root .ticker-content {
  display: inline-block;
  padding-left: 100%;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gold-soft);
  animation: marquee 30s linear infinite;
}
.tools-root .ticker-content a { color: var(--gold); text-decoration: none; font-weight: 700; }
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}

.tools-root .motivasi-quote {
  text-align: center;
  margin: 3rem auto;
  padding: 2.5rem;
  background: linear-gradient(135deg, rgba(6, 32, 24, 0.4) 0%, rgba(3, 8, 7, 0.8) 100%);
  border-radius: 24px;
  border: 1px solid var(--card-border);
  max-width: 800px;
  width: 90%;
}
.tools-root .motivasi-quote p {
  font-size: 1.4rem;
  font-style: italic;
  font-weight: 700;
  color: var(--gold-soft);
  margin: 0 0 0.8rem;
  line-height: 1.4;
  filter: drop-shadow(0 2px 5px rgba(251, 191, 36, 0.15));
}
.tools-root .motivasi-quote span {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.tools-root footer {
  width: 100%;
  background: rgba(2, 6, 5, 0.98);
  color: var(--text-muted);
  text-align: center;
  padding: 2rem 1rem;
  font-size: 0.82rem;
  border-top: 1px solid rgba(20, 184, 166, 0.1);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .tools-root .container { padding: 1.5rem 1rem 3rem; }
  .tools-root .hero-section { padding: 2.5rem 1.5rem; border-radius: 24px; }
  .tools-root h1 { font-size: 2.5rem; }
  .tools-root .hero-subtitle { font-size: 1rem; }
  .tools-root .button-grid { grid-template-columns: 1fr; gap: 0.9rem; }
  .tools-root .tool-button { padding: 1.4rem 1rem; }
  .tools-root .tool-emoji { font-size: 1.9rem; }
  .tools-root .section-title { font-size: 1.15rem; margin: 2rem 0 0.8rem; }
  .tools-root .motivasi-quote p { font-size: 1.2rem; }
  .tools-root .hero-admin-box { flex-direction: column; gap: 8px; padding: 14px 20px; border-radius: 20px; }
  .tools-root .admin-divider { width: 40px; height: 1.5px; }
}
`;
