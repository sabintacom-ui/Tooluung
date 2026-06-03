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
        <div className="hero-section hero-split-layout">
          <div className="hero-left-col">
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

          <div className="hero-right-col">
            <div className="hero-image-card">
              <div className="hero-image-glow" />
              <img src="/gemini-image-gen.png" alt="Gemini AI Image Generation Studio" className="hero-showcase-img" />
              <div className="hero-image-overlay">
                <span className="overlay-badge">⚡ Powered by Gemini 3.5</span>
                <p className="overlay-desc">Smart Image Generation & Automation Studio</p>
              </div>
            </div>
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
  max-width: 1280px;
  padding: 2.5rem 1.5rem 5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  z-index: 1;
}

/* === HERO === */
.tools-root .hero-section {
  padding: 4rem 2.5rem 3.5rem;
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
}

.tools-root .hero-split-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: 3rem;
  text-align: left;
  padding: 4rem 3rem;
}

.tools-root .hero-left-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
}

.tools-root .hero-right-col {
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  perspective: 1000px;
}

.tools-root .hero-image-card {
  position: relative;
  border-radius: 24px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform: rotateY(-6deg) rotateX(4deg);
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease, border-color 0.3s;
  overflow: hidden;
  max-width: 100%;
}

.tools-root .hero-image-card:hover {
  transform: rotateY(0deg) rotateX(0deg) scale(1.02);
  box-shadow: 0 30px 80px rgba(20, 184, 166, 0.25), 0 0 50px rgba(20, 184, 166, 0.15);
  border-color: rgba(20, 184, 166, 0.4);
}

.tools-root .hero-image-glow {
  position: absolute;
  inset: -30px;
  background: radial-gradient(circle at center, rgba(20, 184, 166, 0.25), transparent 70%);
  z-index: 1;
  pointer-events: none;
  animation: glow-pulse 4s infinite alternate;
}

@keyframes glow-pulse {
  0% { opacity: 0.4; transform: scale(0.9); }
  100% { opacity: 0.9; transform: scale(1.1); }
}

.tools-root .hero-showcase-img {
  width: 100%;
  max-width: 440px;
  height: auto;
  border-radius: 18px;
  display: block;
  z-index: 2;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tools-root .hero-image-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  padding: 12px 18px;
  background: rgba(3, 8, 7, 0.82);
  backdrop-filter: blur(16px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 3;
}

.tools-root .overlay-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--teal);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 2px;
}

.tools-root .overlay-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.3;
}

.tools-root .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  font-size: 0.78rem;
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
  width: 30px;
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
  font-size: clamp(2.4rem, 5.5vw, 4rem);
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(180deg, #ffffff 30%, #a7f3d0 70%, var(--gold-soft));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.03em;
  line-height: 1.1;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.3));
}

.tools-root .hero-subtitle {
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
  color: var(--text-muted);
  margin: 0 auto 2.2rem;
  max-width: 660px;
  line-height: 1.6;
}
.tools-root .hero-subtitle .gold { color: var(--gold); font-weight: 700; }

.tools-root .hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}
.tools-root .hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 14px 28px;
  border-radius: 100px;
  font-weight: 800;
  font-size: 0.95rem;
  text-decoration: none;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.2s ease,
              filter 0.2s ease;
}
.tools-root .hero-cta-primary {
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #02120e;
  box-shadow: 0 8px 24px rgba(250, 204, 21, 0.3);
}
.tools-root .hero-cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(250, 204, 21, 0.45), 0 0 15px rgba(250, 204, 21, 0.2);
  filter: brightness(1.08);
}
.tools-root .hero-cta-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.tools-root .hero-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.tools-root .hero-tagline {
  font-size: 0.8rem;
  color: var(--gold-soft);
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: 'Amiri', serif;
  opacity: 0.9;
  filter: drop-shadow(0 2px 5px rgba(251, 191, 36, 0.1));
}

/* === STATS === */
.tools-root .stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 0 0 2.5rem;
}
.tools-root .stat-card {
  padding: 1.4rem 1.2rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
  border: 1px solid var(--card-border);
  border-radius: 20px;
  text-align: center;
  transition: transform 0.2s, border-color 0.2s;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.tools-root .stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(20, 184, 166, 0.25);
  background: rgba(20, 184, 166, 0.02);
}
.tools-root .stat-num {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--gold-soft);
  line-height: 1;
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
}
.tools-root .stat-label {
  font-size: 0.76rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* === SEARCH === */
.tools-root .search-wrapper {
  position: sticky;
  top: 1rem;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.4rem;
  background: rgba(4, 14, 11, 0.8);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  margin: 0 0 1.8rem;
  box-shadow:
    0 15px 45px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.tools-root .search-wrapper:focus-within {
  border-color: rgba(20, 184, 166, 0.6);
  box-shadow:
    0 15px 45px rgba(0, 0, 0, 0.55),
    0 0 15px rgba(20, 184, 166, 0.25);
}
.tools-root .search-icon { font-size: 1.1rem; opacity: 0.85; }
.tools-root .search-input {
  flex: 1;
  background: transparent;
  border: 0;
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}
.tools-root .search-input::placeholder { color: rgba(255, 255, 255, 0.3); }
.tools-root .search-clear {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 0.8rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s;
}
.tools-root .search-clear:hover { background: rgba(255, 255, 255, 0.15); }

.tools-root .search-result-info {
  margin: 0 0 1.5rem;
  padding: 0.8rem 1.2rem;
  background: rgba(20, 184, 166, 0.08);
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: 14px;
  font-size: 0.9rem;
  color: var(--text);
}
.tools-root .search-result-info strong { color: var(--gold-soft); }

/* === CATEGORY NAV === */
.tools-root .category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 2rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}
.tools-root .category-pill {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 100px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.tools-root .category-pill:hover {
  background: rgba(20, 184, 166, 0.08);
  border-color: rgba(20, 184, 166, 0.25);
  color: #5eead4;
}

/* === SECTIONS === */
.tools-root .section-title {
  margin: 3rem 0 1.2rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  scroll-margin-top: 6rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.01em;
}
.tools-root .section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.3), transparent);
}

/* === BUTTON GRID === */
.tools-root .button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 0.8rem;
}

.tools-root .tool-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  padding: 1.4rem;
  min-height: 140px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.005));
  border: 1px solid var(--card-border);
  border-radius: 20px;
  text-decoration: none;
  color: var(--text);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              border-color 0.3s ease,
              background 0.3s ease,
              box-shadow 0.3s ease;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
  animation: cardIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.tools-root .tool-button:hover {
  transform: translateY(-4px) scale(1.01);
  border-color: rgba(20, 184, 166, 0.4);
  background: linear-gradient(145deg, rgba(20, 184, 166, 0.08), rgba(255, 255, 255, 0.015));
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.35),
    0 0 15px rgba(20, 184, 166, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.tools-root .tool-emoji {
  font-size: 1.8rem;
  margin-bottom: 0.8rem;
  display: block;
  line-height: 1;
  transition: transform 0.3s ease;
}
.tools-root .tool-button:hover .tool-emoji {
  transform: scale(1.18) rotate(3deg);
}

.tools-root .tool-label {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.1px;
  margin-bottom: 0.4rem;
  color: #fff;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.tools-root .tool-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: auto;
}

.tools-root .badge-new,
.tools-root .badge-beta {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 9px;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-radius: 6px;
}
.tools-root .badge-new {
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #02120e;
  box-shadow: 0 2px 10px rgba(250, 204, 21, 0.4);
}
.tools-root .badge-beta {
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  color: #fff;
  box-shadow: 0 2px 10px rgba(56, 189, 248, 0.4);
}

/* === EMPTY STATE === */
.tools-root .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.01);
  border: 1px dashed var(--card-border);
  border-radius: 24px;
  margin-top: 1rem;
}
.tools-root .empty-emoji {
  font-size: 3rem;
  margin-bottom: 0.8rem;
}
.tools-root .empty-state h3 {
  font-size: 1.2rem;
  margin: 0 0 0.5rem;
  color: #fff;
}
.tools-root .empty-state p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0 0 1.5rem;
}
.tools-root .btn-clear {
  padding: 12px 26px;
  background: linear-gradient(135deg, var(--gold), #f59e0b);
  color: #02120e;
  border: 0;
  border-radius: 100px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 5px 15px rgba(250, 204, 21, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}
.tools-root .btn-clear:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(250, 204, 21, 0.35);
}

/* === TICKER === */
.tools-root .ticker-wrapper {
  width: 100%;
  background: rgba(3, 8, 7, 0.95);
  padding: 1rem 0;
  overflow: hidden;
  white-space: nowrap;
  border-top: 1px solid rgba(20, 184, 166, 0.15);
  margin-top: 3rem;
  position: relative;
}
.tools-root .ticker-content {
  display: inline-block;
  padding-left: 100%;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--gold-soft);
  animation: marquee 35s linear infinite;
}
.tools-root .ticker-content a { color: var(--gold); text-decoration: none; font-weight: 700; }
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}

.tools-root .motivasi-quote {
  text-align: center;
  margin: 3rem auto;
  padding: 2.5rem 2rem;
  background: linear-gradient(135deg, rgba(6, 32, 24, 0.4), rgba(3, 8, 7, 0.8));
  border-radius: 24px;
  border: 1px solid var(--card-border);
  max-width: 800px;
  width: calc(100% - 3rem);
}
.tools-root .motivasi-quote p {
  font-size: 1.35rem;
  font-style: italic;
  font-weight: 700;
  color: var(--gold-soft);
  margin: 0 0 0.8rem;
  line-height: 1.5;
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

/* === PROMPT SIMULATOR === */
.tools-root .prompt-simulator-card {
  width: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.005));
  backdrop-filter: blur(40px);
  border: 1px solid var(--card-border);
  border-radius: 28px;
  padding: 2.2rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  position: relative;
  overflow: hidden;
}

.tools-root .prompt-simulator-card::before {
  content: "";
  position: absolute;
  top: -20%;
  right: -10%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.1), transparent 60%);
  pointer-events: none;
}

.tools-root .simulator-header {
  margin-bottom: 2rem;
  text-align: left;
}

.tools-root .sim-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--teal-deep), rgba(20, 184, 166, 0.2));
  color: #5eead4;
  font-size: 0.65rem;
  font-weight: 800;
  border-radius: 6px;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  border: 1px solid rgba(20, 184, 166, 0.2);
}

.tools-root .simulator-header h3 {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}

.tools-root .simulator-header p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
  max-width: 720px;
  line-height: 1.5;
}

.tools-root .simulator-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2.5rem;
  align-items: start;
}

.tools-root .simulator-left {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.tools-root .sim-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--gold);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.tools-root .prompt-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tools-root .prompt-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tools-root .prompt-pill:hover {
  background: rgba(20, 184, 166, 0.06);
  border-color: rgba(20, 184, 166, 0.25);
  color: #5eead4;
}

.tools-root .prompt-pill.active {
  background: rgba(20, 184, 166, 0.12);
  border-color: rgba(20, 184, 166, 0.45);
  color: #5eead4;
  box-shadow: 0 0 15px rgba(20, 184, 166, 0.15);
}

.tools-root .prompt-input-box {
  padding: 18px;
  background: rgba(2, 10, 8, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
}

.tools-root .prompt-prefix {
  font-family: monospace;
  font-size: 0.76rem;
  color: var(--teal);
  font-weight: 700;
}

.tools-root .prompt-text-val {
  font-size: 0.88rem;
  color: #fff;
  line-height: 1.4;
  margin: 0;
  font-weight: 500;
}

.tools-root .sim-info-footer {
  font-size: 0.74rem;
  color: var(--text-muted);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
  margin-top: 0.5rem;
}

.tools-root .sim-render-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.tools-root .sim-rendered-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tools-root .sim-loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(3, 8, 7, 0.88);
  backdrop-filter: blur(8px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.tools-root .sim-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(20, 184, 166, 0.15);
  border-top-color: var(--teal);
  border-radius: 50%;
  animation: sim-spin 0.8s linear infinite;
}

@keyframes sim-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tools-root .sim-loader-text {
  font-size: 0.82rem;
  color: var(--teal);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.tools-root .sim-rendered-meta {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
  z-index: 5;
}

.tools-root .sim-meta-tag {
  padding: 4px 10px;
  background: rgba(4, 14, 11, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
}

/* === RESPONSIVE === */
@media (max-width: 900px) {
  .tools-root .hero-split-layout {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 3rem 2rem;
    gap: 2.5rem;
  }
  .tools-root .hero-left-col {
    align-items: center;
  }
  .tools-root .hero-right-col {
    perspective: none;
  }
  .tools-root .hero-image-card {
    transform: none;
    max-width: 440px;
  }
  .tools-root .hero-image-card:hover {
    transform: scale(1.01);
  }
  .tools-root .simulator-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  .tools-root .sim-render-viewport {
    max-width: 440px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .tools-root .container { padding: 1.5rem 1rem 3rem; }
  .tools-root .hero-section { padding: 2.5rem 1.5rem; border-radius: 24px; }
  .tools-root .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .tools-root .stat-num { font-size: 1.8rem; }
  .tools-root .button-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .tools-root .tool-button { padding: 1.1rem; min-height: 120px; border-radius: 16px; }
  .tools-root .tool-emoji { font-size: 1.6rem; }
  .tools-root .tool-label { font-size: 0.85rem; }
  .tools-root .tool-desc { font-size: 0.72rem; }
  .tools-root .section-title { font-size: 1.15rem; margin: 2rem 0 0.8rem; }
  .tools-root .category-nav { padding: 0.6rem; gap: 0.4rem; }
  .tools-root .category-pill { padding: 6px 12px; font-size: 0.74rem; }
  .tools-root .search-wrapper { padding: 0.7rem 1.1rem; }
  .tools-root .search-input { font-size: 0.9rem; }
  .tools-root .hero-cta { padding: 12px 22px; font-size: 0.9rem; }
}

@media (max-width: 480px) {
  .tools-root .button-grid { grid-template-columns: 1fr; }
  .tools-root .tool-button { min-height: 100px; }
  .tools-root .stats-grid { grid-template-columns: 1fr; }
  .tools-root .prompt-simulator-card { padding: 1.5rem 1.2rem; border-radius: 20px; }
  .tools-root .prompt-pill { padding: 8px 12px; font-size: 0.78rem; }
}
`;
