import Link from "next/link";
import { ALL_TOOLS } from "@/lib/tools/registry";
import { ToolsExplorer } from "./tools-explorer";

export const revalidate = 60;

export const metadata = {
  title: "Pusat Alat Konten Kreator — Sibermas UIN SAIZU",
  description:
    "80+ Tools AI internal untuk konten kreator dakwah & edukasi: Generator video, Clipper Shorts, SEO, Thumbnail, Voice, Music, dan lainnya — semua langsung di Sibermas.",
};

const FEATURED = [
  {
    emoji: "🎬",
    label: "VIDEO GENERATOR",
    description: "Pipeline AI 7-langkah: skrip → suara → musik → thumbnail → render → upload",
    href: "/generator",
    badge: "NEW" as const,
  },
  {
    emoji: "✂️",
    label: "CLIPPER SHORTS",
    description: "Auto-clip kajian YouTube panjang jadi Shorts 9:16 + upload otomatis",
    href: "/clipper",
    badge: "NEW" as const,
  },
];

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

export default function Home() {
  // Serializable tools for client component
  const toolsForClient = ALL_TOOLS.map((t) => ({
    slug: t.slug,
    emoji: t.emoji,
    label: t.label,
    description: t.description,
    category: t.category,
    badge: t.badge,
  }));

  return (
    <div className="tools-root">
      <style>{toolsCss}</style>

      <div className="container">
        {/* Hero */}
        <div className="hero-section">
          <div className="hero-badge">
            <span className="badge-line" />
            <span className="dot" /> Sibermas UIN SAIZU
            <span className="badge-line" />
          </div>
          <h1>Pusat AI Kreator</h1>
          <div className="hero-subtitle">
            <span className="gold">80+ Tools</span> untuk konten dakwah, edukasi, dan kreatif —
            <span className="gold"> 100% gratis</span> untuk kreator Indonesia
          </div>

          <div className="hero-actions">
            <a href="#featured" className="hero-cta hero-cta-primary">
              🚀 Mulai Eksplor
            </a>
            <Link href="/generator" className="hero-cta hero-cta-secondary">
              🎬 Generator Video
            </Link>
          </div>

          <div className="hero-tagline">
            ✦ Bismillahirrahmanirrahim ✦
          </div>
        </div>

        {/* Tools Explorer (search + categories) */}
        <ToolsExplorer
          tools={toolsForClient}
          featured={FEATURED}
          categoryOrder={CATEGORY_ORDER}
          categoryLabels={CATEGORY_LABEL}
        />
      </div>

      <div className="ticker-wrapper">
        <div className="ticker-content">
          ✨ Sibermas Pusat Studi & Riset Cyber Mahasiswa UIN SAIZU Purwokerto · Konten Dakwah,
          Edukasi, dan Inovasi Mahasiswa · Hubungi admin via{" "}
          <a href="https://wa.me/6287884242420" target="_blank" rel="noreferrer">
            WhatsApp
          </a>{" "}
          atau{" "}
          <a href="https://uinsaizu.ac.id" target="_blank" rel="noreferrer">
            uinsaizu.ac.id
          </a>
        </div>
      </div>

      <div className="motivasi-quote">
        <p>&ldquo;Kerjakan Lebih, Jika Ingin Hasil Lebih&rdquo;</p>
        <span>By Sibermas UIN SAIZU</span>
      </div>

      <footer>
        <p>
          &copy; 2026 Sibermas UIN SAIZU. All rights reserved. | Lokasi: Purwokerto, Jawa Tengah
        </p>
      </footer>
    </div>
  );
}

const toolsCss = `
:root {
  --bg: #080b14;
  --gold: #facc15;
  --gold-dark: #d4a017;
  --text: #e0e0e0;
  --text-muted: rgba(255,255,255,0.65);
  --card-bg: rgba(255,255,255,0.03);
  --card-border: rgba(255,255,255,0.08);
  --card-hover-border: rgba(250,204,21,0.5);
}

.tools-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
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
  max-width: 1280px;
  padding: 2rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/* === HERO === */
.tools-root .hero-section {
  text-align: center;
  padding: 3rem 2rem 2.5rem;
  margin-bottom: 2rem;
  width: 100%;
  position: relative;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(250,204,21,0.1), transparent 70%),
    linear-gradient(135deg, rgba(255,255,255,0.03), rgba(250,204,21,0.04));
  backdrop-filter: blur(40px) saturate(1.6);
  border-radius: 28px;
  border: 1px solid var(--card-border);
  box-shadow: 0 8px 60px rgba(0,0,0,0.4);
  overflow: hidden;
}

.tools-root .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 1.5rem;
  letter-spacing: 0.5px;
}
.tools-root .hero-badge .dot {
  width: 7px;
  height: 7px;
  background: var(--gold);
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
  box-shadow: 0 0 8px rgba(250,204,21,0.8);
}
.tools-root .hero-badge .badge-line {
  width: 30px;
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

.tools-root h1 {
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  font-weight: 800;
  margin: 0 0 0.8rem;
  background: linear-gradient(180deg, #ffe066 0%, var(--gold) 50%, var(--gold-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.tools-root .hero-subtitle {
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
  color: var(--text-muted);
  margin: 0 auto 1.8rem;
  max-width: 640px;
  line-height: 1.5;
}
.tools-root .hero-subtitle .gold { color: var(--gold); font-weight: 700; }

.tools-root .hero-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.tools-root .hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 12px 26px;
  border-radius: 100px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.25s ease;
}
.tools-root .hero-cta-primary {
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #000;
  box-shadow: 0 8px 20px rgba(250,204,21,0.3);
}
.tools-root .hero-cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(250,204,21,0.45);
}
.tools-root .hero-cta-secondary {
  background: rgba(255,255,255,0.06);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.12);
}
.tools-root .hero-cta-secondary:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-2px);
}

.tools-root .hero-tagline {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.4);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* === STATS === */
.tools-root .stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 0 0 1.8rem;
}
.tools-root .stat-card {
  padding: 1.2rem 1rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  text-align: center;
  transition: all 0.2s ease;
}
.tools-root .stat-card:hover {
  border-color: rgba(250,204,21,0.3);
  background: rgba(250,204,21,0.04);
}
.tools-root .stat-num {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--gold);
  line-height: 1;
  margin-bottom: 0.3rem;
}
.tools-root .stat-label {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* === SEARCH === */
.tools-root .search-wrapper {
  position: sticky;
  top: 0.5rem;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  background: rgba(15,18,30,0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px;
  margin: 0 0 1.2rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.tools-root .search-icon { font-size: 1.05rem; opacity: 0.7; }
.tools-root .search-input {
  flex: 1;
  background: transparent;
  border: 0;
  color: var(--text);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}
.tools-root .search-input::placeholder { color: rgba(255,255,255,0.4); }
.tools-root .search-clear {
  background: rgba(255,255,255,0.08);
  color: var(--text);
  border: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
  cursor: pointer;
  font-family: inherit;
}
.tools-root .search-clear:hover { background: rgba(255,255,255,0.16); }

.tools-root .search-result-info {
  margin: 0 0 1rem;
  padding: 0.7rem 1rem;
  background: rgba(250,204,21,0.08);
  border: 1px solid rgba(250,204,21,0.2);
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--text);
}
.tools-root .search-result-info strong { color: var(--gold); }

/* === CATEGORY NAV === */
.tools-root .category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 1.5rem;
  padding: 0.7rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
}
.tools-root .category-pill {
  padding: 6px 12px;
  background: rgba(255,255,255,0.04);
  color: var(--text);
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 100px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.tools-root .category-pill:hover {
  background: rgba(250,204,21,0.1);
  border-color: rgba(250,204,21,0.3);
  color: var(--gold);
}

/* === SECTIONS === */
.tools-root .section-title {
  margin: 2rem 0 1rem;
  font-size: 1.2rem;
  font-weight: 800;
  color: rgba(255,255,255,0.95);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  scroll-margin-top: 5rem;
}
.tools-root .section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(250,204,21,0.25), transparent);
}

/* === BUTTON GRID (UNIFORM) === */
.tools-root .button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.9rem;
  margin-bottom: 0.5rem;
}

.tools-root .tool-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  padding: 1.1rem;
  min-height: 132px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  text-decoration: none;
  color: var(--text);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: cardIn 0.5s ease-out backwards;
}
@keyframes cardIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.tools-root .tool-button:hover {
  transform: translateY(-3px);
  border-color: var(--card-hover-border);
  background: rgba(250,204,21,0.04);
  box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(250,204,21,0.3);
}

.tools-root .tool-emoji {
  font-size: 1.6rem;
  margin-bottom: 0.6rem;
  display: block;
  line-height: 1;
  transition: transform 0.25s ease;
}
.tools-root .tool-button:hover .tool-emoji {
  transform: scale(1.15);
}

.tools-root .tool-label {
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.2px;
  margin-bottom: 0.3rem;
  color: rgba(255,255,255,0.95);
}

.tools-root .tool-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: auto;
}

.tools-root .badge-new,
.tools-root .badge-beta {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border-radius: 4px;
}
.tools-root .badge-new {
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #000;
}
.tools-root .badge-beta {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
}

/* === EMPTY STATE === */
.tools-root .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--card-bg);
  border: 1px dashed var(--card-border);
  border-radius: 20px;
}
.tools-root .empty-emoji {
  font-size: 3rem;
  margin-bottom: 0.6rem;
}
.tools-root .empty-state h3 {
  font-size: 1.1rem;
  margin: 0 0 0.4rem;
  color: var(--text);
}
.tools-root .empty-state p {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0 0 1.2rem;
}
.tools-root .btn-clear {
  padding: 10px 22px;
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #000;
  border: 0;
  border-radius: 100px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.tools-root .btn-clear:hover { transform: translateY(-1px); }

/* === TICKER === */
.tools-root .ticker-wrapper {
  width: 100%;
  background: rgba(8,11,20,0.98);
  padding: 0.85rem 0;
  overflow: hidden;
  white-space: nowrap;
  border-top: 1px solid rgba(250,204,21,0.1);
  margin-top: 2rem;
}
.tools-root .ticker-content {
  display: inline-block;
  padding-left: 100%;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gold);
  animation: marquee 40s linear infinite;
}
.tools-root .ticker-content a { color: var(--gold); text-decoration: none; font-weight: 700; }
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}

.tools-root .motivasi-quote {
  text-align: center;
  margin: 2rem auto;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, rgba(20,24,40,0.6), rgba(12,14,28,0.8));
  border-radius: 20px;
  border: 1px solid rgba(250,204,21,0.1);
  max-width: 720px;
  width: calc(100% - 3rem);
}
.tools-root .motivasi-quote p {
  font-size: 1.2rem;
  font-style: italic;
  font-weight: 700;
  color: var(--gold);
  margin: 0 0 0.5rem;
  line-height: 1.4;
}
.tools-root .motivasi-quote span {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
  font-weight: 600;
}

.tools-root footer {
  width: 100%;
  background: rgba(5,7,15,0.98);
  color: rgba(255,255,255,0.4);
  text-align: center;
  padding: 1.2rem;
  font-size: 0.78rem;
  border-top: 1px solid rgba(250,204,21,0.06);
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .tools-root .container { padding: 1rem 0.8rem 2.5rem; }
  .tools-root .hero-section { padding: 2rem 1rem 1.5rem; border-radius: 20px; }
  .tools-root .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
  .tools-root .stat-num { font-size: 1.5rem; }
  .tools-root .button-grid { grid-template-columns: repeat(2, 1fr); gap: 0.7rem; }
  .tools-root .tool-button { padding: 0.85rem; min-height: 120px; }
  .tools-root .tool-emoji { font-size: 1.4rem; }
  .tools-root .tool-label { font-size: 0.8rem; }
  .tools-root .tool-desc { font-size: 0.68rem; }
  .tools-root .section-title { font-size: 1rem; margin: 1.5rem 0 0.7rem; }
  .tools-root .category-nav { padding: 0.5rem; gap: 0.3rem; }
  .tools-root .category-pill { padding: 5px 10px; font-size: 0.72rem; }
  .tools-root .search-wrapper { padding: 0.6rem 0.85rem; }
  .tools-root .search-input { font-size: 0.88rem; }
  .tools-root .hero-cta { padding: 10px 20px; font-size: 0.88rem; }
}

@media (max-width: 480px) {
  .tools-root .button-grid { grid-template-columns: 1fr; }
  .tools-root .tool-button { min-height: 100px; }
}
`;
