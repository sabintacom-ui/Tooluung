import Link from "next/link";
import { ALL_TOOLS } from "@/lib/tools/registry";

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
  { emoji: "🎬", label: "VIDEO GENERATOR", href: "/generator", badge: "NEW" },
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
.tools-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #080b14;
  color: #e0e0e0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
.tools-root * { box-sizing: border-box; }
.tools-root .container {
  width: 100%;
  max-width: 1200px;
  padding: 2rem 2rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Hero */
.tools-root .hero-section {
  text-align: center;
  padding: 3.5rem 2.5rem;
  margin-bottom: 2.5rem;
  width: 100%;
  position: relative;
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 40%, rgba(250,204,21,0.04) 100%);
  backdrop-filter: blur(40px) saturate(1.8);
  border-radius: 32px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 60px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.02) inset;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tools-root .hero-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 100%;
  background: radial-gradient(ellipse, rgba(250,204,21,0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
.tools-root .hero-section > * { position: relative; z-index: 1; }

.tools-root .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #facc15;
  margin-bottom: 1.8rem;
  letter-spacing: 0.5px;
  animation: fadeInUp 0.6s ease-out;
}
.tools-root .hero-badge .dot {
  width: 7px;
  height: 7px;
  background: #facc15;
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
  box-shadow: 0 0 8px rgba(250,204,21,0.8);
}
.tools-root .hero-badge .badge-line {
  width: 40px;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, rgba(250,204,21,0.5));
}
.tools-root .hero-badge .badge-line:last-child {
  background: linear-gradient(90deg, rgba(250,204,21,0.5), transparent);
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.6); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.tools-root h1 {
  font-family: 'Dancing Script', 'Brush Script MT', cursive;
  font-size: 4rem;
  font-style: italic;
  font-weight: 700;
  background: linear-gradient(180deg, #ffe066 0%, #facc15 30%, #d4a017 60%, #b8860b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
  line-height: 1.2;
  margin-bottom: 1.2rem;
  filter: drop-shadow(0 0 15px rgba(250,204,21,0.5));
  animation: visionGlow 4s ease-in-out infinite alternate, fadeInUp 0.8s ease-out;
}
@keyframes visionGlow {
  from { filter: drop-shadow(0 0 10px rgba(250,204,21,0.4)); }
  to { filter: drop-shadow(0 0 25px rgba(250,204,21,0.7)); }
}
.tools-root .hero-subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(255,255,255,0.75);
  margin-bottom: 1.8rem;
  letter-spacing: 0.3px;
}
.tools-root .hero-subtitle .gold { color: #facc15; font-weight: 700; }

.tools-root .hero-tagline-box,
.tools-root .hero-admin-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 28px;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 50px;
  margin-bottom: 1.2rem;
  width: fit-content;
  max-width: 90%;
  min-height: 52px;
}
.tools-root .hero-admin-box { gap: 0; margin-bottom: 1.5rem; }
.tools-root .tagline-text { font-size: 1rem; font-weight: 500; color: rgba(255,255,255,0.85); margin: 0; }
.tools-root .admin-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  padding: 0 16px;
}
.tools-root .admin-icon { font-size: 1.1rem; }
.tools-root .admin-divider { width: 1.5px; height: 20px; background: rgba(255,255,255,0.12); }
.tools-root .hero-line {
  width: 120px;
  height: 1px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, rgba(250,204,21,0.4), transparent);
  opacity: 0.8;
}

.tools-root .live-online-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 1.2rem;
  padding: 9px 20px;
  background: rgba(34,197,94,0.06);
  border: 1px solid rgba(34,197,94,0.2);
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
  box-shadow: 0 0 8px rgba(34,197,94,0.8);
  animation: live-pulse 1.6s ease-out infinite;
}
@keyframes live-pulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55), 0 0 8px rgba(34,197,94,0.8); }
  70% { box-shadow: 0 0 0 10px rgba(34,197,94,0), 0 0 8px rgba(34,197,94,0.8); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0), 0 0 8px rgba(34,197,94,0.8); }
}
.tools-root .live-online-num {
  min-width: 4ch;
  text-align: center;
  color: #4ade80;
  font-weight: 800;
  font-size: 1rem;
}
.tools-root .live-online-label { color: rgba(255,255,255,0.75); font-weight: 500; }

/* Section title */
.tools-root .section-title {
  width: 100%;
  margin: 2.5rem 0 1rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: rgba(255,255,255,0.95);
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.tools-root .section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(250,204,21,0.3), transparent);
  margin-left: 0.5rem;
}

/* Button Grid */
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
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  color: #e0e0e0;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.02) inset;
  position: relative;
  overflow: hidden;
  animation: fadeInScale 0.5s ease-out backwards;
}
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.tools-root .tool-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(250,204,21,0.06), transparent);
  transition: left 0.5s;
}
.tools-root .tool-button:hover::before { left: 100%; }
.tools-root .tool-button:hover {
  transform: translateY(-5px) scale(1.02);
  border-color: rgba(250,204,21,0.7);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(250,204,21,0.4), 0 0 18px rgba(250,204,21,0.3);
  background: rgba(250,204,21,0.04);
}
.tools-root .tool-button:active { transform: translateY(-2px) scale(0.98); }

.tools-root .tool-emoji {
  font-size: 2.3rem;
  margin-bottom: 0.6rem;
  display: block;
  transition: transform 0.3s ease;
}
.tools-root .tool-button:hover .tool-emoji {
  transform: scale(1.15) rotate(3deg);
  filter: drop-shadow(0 0 10px rgba(250,204,21,0.6));
}
.tools-root .tool-label { font-size: 0.95rem; line-height: 1.3; }

.tools-root .badge-new,
.tools-root .badge-beta {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 9px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border-radius: 6px;
  animation: badge-pulse 2s ease-in-out infinite;
}
.tools-root .badge-new {
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #000;
  box-shadow: 0 2px 12px rgba(250,204,21,0.5);
}
.tools-root .badge-beta {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 2px 12px rgba(139,92,246,0.5);
}
@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 2px 12px rgba(250,204,21,0.4); }
  50% { box-shadow: 0 2px 24px rgba(250,204,21,0.9); }
}

.tools-root .ticker-wrapper {
  width: 100%;
  background: rgba(8,11,20,0.98);
  padding: 1rem 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
  overflow: hidden;
  white-space: nowrap;
  margin-top: auto;
  position: relative;
}
.tools-root .ticker-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #facc15, transparent);
  animation: tickerGlow 2s ease-in-out infinite;
}
@keyframes tickerGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.tools-root .ticker-content {
  display: inline-block;
  padding-left: 100%;
  font-size: 1rem;
  font-weight: 600;
  color: #facc15;
  animation: marquee 30s linear infinite;
}
.tools-root .ticker-content a { color: #facc15; text-decoration: none; font-weight: 700; }
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}

.tools-root .motivasi-quote {
  text-align: center;
  margin: 3rem auto;
  padding: 2.5rem;
  background: linear-gradient(135deg, rgba(20,24,40,0.8) 0%, rgba(12,14,28,0.9) 100%);
  border-radius: 20px;
  border: 1px solid rgba(250,204,21,0.15);
  max-width: 800px;
  width: 90%;
}
.tools-root .motivasi-quote p {
  font-size: 1.4rem;
  font-style: italic;
  font-weight: 700;
  color: #facc15;
  margin: 0 0 0.8rem;
  line-height: 1.4;
}
.tools-root .motivasi-quote span {
  font-size: 1rem;
  color: #888;
  font-weight: 600;
  letter-spacing: 1px;
}

.tools-root footer {
  width: 100%;
  background: rgba(5,7,15,0.98);
  color: #666;
  text-align: center;
  padding: 1.5rem;
  font-size: 0.85rem;
  border-top: 1px solid rgba(250,204,21,0.08);
}

@media (max-width: 768px) {
  .tools-root .container { padding: 1.5rem 1rem 3rem; }
  .tools-root .hero-section { padding: 2.5rem 1.5rem; border-radius: 24px; }
  .tools-root h1 { font-size: 2.8rem; }
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
