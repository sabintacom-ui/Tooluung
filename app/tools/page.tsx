import Link from "next/link";

export const metadata = {
  title: "Pusat Alat Konten Kreator — Sibermas UIN SAIZU",
  description: "45+ Tools AI untuk konten kreator dakwah & edukasi: Generator video YouTube, Clipper Shorts, SEO, Thumbnail, Voice, Music, dan lainnya.",
};

type Tool = {
  emoji: string;
  label: string;
  href: string;
  external?: boolean;
  badge?: "NEW" | "SOON";
};

const TOOLS: Tool[] = [
  // === Sibermas Native ===
  { emoji: "🎬", label: "VIDEO GENERATOR", href: "/", badge: "NEW" },
  { emoji: "✂️", label: "CLIPPER SHORTS", href: "/clipper", badge: "NEW" },

  // === Music & Audio ===
  { emoji: "🎵", label: "PLAN MUSIC", href: "https://imamjanuar.my.id/plan-music/", external: true, badge: "NEW" },
  { emoji: "🎼", label: "KAMPUNG LIRIK", href: "https://imamjanuar.my.id/kampunglirik/", external: true },
  { emoji: "🎵", label: "KAMPUNG LAGU", href: "https://imamjanuar.my.id/kampunglagu/", external: true },
  { emoji: "🎸", label: "KAMPUNG MUSIC", href: "https://araz.biz.id/kampunglagu/", external: true },
  { emoji: "🎙️", label: "SUARAKU", href: "https://imamjanuar.my.id/suaraku/", external: true },
  { emoji: "🎙️", label: "KAMPUNG YOUTUBER VOICE", href: "https://imamjanuar.my.id/voicer/", external: true },
  { emoji: "🎤", label: "VOICER AI", href: "https://ai.studio/apps/101a3bee-cd59-4e38-8d7e-462922e1a19a?fullscreenApplet=true", external: true },
  { emoji: "🔊", label: "TEXT TO SUARA", href: "https://tapen.my.id", external: true },

  // === Planning & Konten ===
  { emoji: "📅", label: "PLAN KONTEN", href: "https://imamjanuar.my.id/plan/", external: true, badge: "NEW" },
  { emoji: "📜", label: "GUDANG KONTEN", href: "https://imamjanuar.my.id/konten/", external: true },
  { emoji: "💡", label: "GUDANG IDE", href: "https://araz.biz.id/konten/", external: true },
  { emoji: "📦", label: "GUDANG KONTEN PRO V1", href: "https://ai.studio/apps/drive/1lq0rLLCXU4mqrvIC_kL4ia0bi5xQ9Xuv?fullscreenApplet=true", external: true },
  { emoji: "📦", label: "GUDANG KONTEN PRO V2", href: "https://imamjanuar.my.id/gudang-konten/", external: true, badge: "NEW" },
  { emoji: "🚀", label: "CREATOR ULTIMA", href: "https://imamjanuar.my.id/creator-ultima/", external: true, badge: "NEW" },
  { emoji: "📜", label: "CERITAKU", href: "https://imamjanuar.my.id/cerita/", external: true },

  // === Visual & Image ===
  { emoji: "🖼️", label: "SCRIP TO PROMPT", href: "https://imamjanuar.my.id/image/", external: true, badge: "NEW" },
  { emoji: "🖼️", label: "PROMPT VISION", href: "https://imamjanuar.my.id/gambar/", external: true, badge: "NEW" },
  { emoji: "🎨", label: "GAMBARKU", href: "https://imamjanuar.my.id/gambarku/", external: true, badge: "NEW" },
  { emoji: "🎨", label: "SCRIP TO IMAGE", href: "https://ai.studio/apps/30f3700d-ecc7-446e-8763-85f156c07352?fullscreenApplet=true", external: true },
  { emoji: "🖼️", label: "VISUAL TO PROMPT", href: "https://ai.studio/apps/49d25b74-35f5-463f-afa3-7473c23ab285?fullscreenApplet=true", external: true },
  { emoji: "🎬", label: "PROMPT VIDEO", href: "https://araz.biz.id/video/", external: true },

  // === Thumbnail ===
  { emoji: "📐", label: "THUMBNAIL MAKER (SITE)", href: "https://imamjanuar.my.id/thumbail-maker/", external: true },
  { emoji: "🎨", label: "THUMBNAIL MAKER", href: "https://gemini.google.com/share/bd2258a0d61c", external: true },
  { emoji: "🎯", label: "THUMBNAIL MASTER AI", href: "https://gemini.google.com/share/9b09349359d5", external: true },
  { emoji: "🎯", label: "THUMBNAIL MASTER AI PRO", href: "https://ai.studio/apps/0d683a55-4b5a-442b-958d-81db646c0ebd?fullscreenApplet=true", external: true },

  // === Suno / Lirik ===
  { emoji: "🎶", label: "PROMPT SUNO INSTRUMEN", href: "https://chatgpt.com/g/g-681480f8a4688191b94abd2af3c3390a-suno-5-0-prompt-generator", external: true },
  { emoji: "🎹", label: "PROMPT INSTRUMENT", href: "https://ai.studio/apps/483e31c3-575e-423d-a5d3-d6b804e6bb45?fullscreenApplet=true", external: true },
  { emoji: "🎤", label: "PEMBUAT LIRIK LAGU SUNO", href: "https://chatgpt.com/g/g-6963e9ffde5c8191a676e337c22c20ff-pembuat-lirik-dan-style-suno", external: true },
  { emoji: "🎸", label: "PEMBUAT LIRIK LAGU REGGAE", href: "https://chatgpt.com/g/g-69f4cbcb8f7c81919db1251c6763215d-pembuat-lirik-lagu-reggae", external: true },
  { emoji: "🌍", label: "PEMBUAT KONTEN MUSIK LENGKAP", href: "https://chatgpt.com/g/g-69a065977bf08191ba07989c60a89bdd-global-auto-detect-international-music", external: true },
  { emoji: "🎵", label: "STYLE SUNO INSTRUMENT", href: "https://gemini.google.com/share/3b76e2365de5", external: true },
  { emoji: "🎬", label: "SUNO CINEMATIC PRO", href: "https://gemini.google.com/share/997c4ddfc491", external: true },

  // === Spoken / Vocal ===
  { emoji: "💝", label: "QOLBU SPOKEN", href: "https://gemini.google.com/share/bdd30dc95c19", external: true },
  { emoji: "🗣️", label: "SPOKEN WORD GENERATOR", href: "https://chatgpt.com/g/g-6849807d62008191b277edc10596bcaf-spoken-word", external: true },
  { emoji: "🧘", label: "RELAX MUSIC PROMPT", href: "https://gemini.google.com/share/d469c5ccff2b", external: true },

  // === SEO & YouTube ===
  { emoji: "📺", label: "ASISTEN SEO YT", href: "https://imamjanuar.my.id/judul/", external: true },
  { emoji: "🔍", label: "ASISTEN SEO", href: "https://ai.studio/apps/drive/1Qm5YbAK_kmrkTO7ejoJHdW4FXImtB69o?fullscreenApplet=true", external: true },
  { emoji: "✍️", label: "JUDUL, DESKRIPSI & TAG", href: "https://chatgpt.com/g/g-6839c982a500819195ae9fbd69161e90-buat-judul-otomatis", external: true },

  // === Quran & Dakwah ===
  { emoji: "📖", label: "TEXT ARAB ALQURAN", href: "https://litequran.net/", external: true },

  // === Utilities ===
  { emoji: "📺", label: "SEWA LIVE", href: "https://sewalive.com", external: true },
  { emoji: "📋", label: "CARA BANDING DISMONET", href: "https://imamjanuar.my.id/cara-banding-dismonet.html", external: true },
  { emoji: "✉️", label: "KONTAK ADMIN VIA WA", href: "https://wa.me/6287884242420", external: true },
  { emoji: "📥", label: "DOWNLOAD MP3 APP", href: "https://bit.ly/kampungmp3", external: true },
  { emoji: "🎬", label: "VIDEO COMBINER", href: "https://bit.ly/VideoCombinerWin", external: true },
  { emoji: "🎞️", label: "COMBINER V3", href: "https://bit.ly/combinerv3", external: true },
];

function ToolCard({ tool, idx }: { tool: Tool; idx: number }) {
  const inner = (
    <>
      <span className="tool-emoji">{tool.emoji}</span>
      <span className="tool-label">{tool.label}</span>
      {tool.badge ? <div className={`badge-${tool.badge.toLowerCase()}`}>{tool.badge}</div> : null}
    </>
  );
  const style = { animationDelay: `${Math.min(idx * 0.03, 0.6)}s` } as React.CSSProperties;
  if (tool.external) {
    return (
      <a
        href={tool.href}
        target="_blank"
        rel="noopener noreferrer"
        className="tool-button"
        style={style}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={tool.href} className="tool-button" style={style}>
      {inner}
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <div className="tools-root">
      <style>{toolsCss}</style>

      <div className="container">
        <div className="hero-section">
          <div className="hero-badge">
            <span className="badge-line" />
            <span className="dot" /> {TOOLS.length}+ Tools AI Konten Kreator
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
            <span className="live-online-num">{TOOLS.length}</span>
            <span className="live-online-label">Tools Tersedia</span>
          </div>
        </div>

        <div className="button-grid">
          {TOOLS.map((tool, idx) => (
            <ToolCard key={`${tool.label}-${idx}`} tool={tool} idx={idx} />
          ))}
        </div>
      </div>

      <div className="ticker-wrapper">
        <div className="ticker-content">
          ✨ Sibermas Pusat Studi & Riset Cyber Mahasiswa UIN SAIZU Purwokerto · Konten Dakwah, Edukasi, dan Inovasi Mahasiswa · Hubungi admin via{" "}
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
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  border-radius: 32px;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 60px rgba(0,0,0,0.5), 0 2px 4px rgba(255,255,255,0.02) inset, 0 0 0 0.5px rgba(255,255,255,0.06) inset;
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
.tools-root .hero-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  pointer-events: none;
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
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
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
  filter: drop-shadow(0 0 15px rgba(250,204,21,0.5)) drop-shadow(0 4px 8px rgba(0,0,0,0.6));
  animation: visionGlow 4s ease-in-out infinite alternate, fadeInUp 0.8s ease-out;
}
@keyframes visionGlow {
  from { filter: drop-shadow(0 0 10px rgba(250,204,21,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.6)); }
  to { filter: drop-shadow(0 0 25px rgba(250,204,21,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.6)); }
}

.tools-root .hero-subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(255,255,255,0.75);
  margin-bottom: 1.8rem;
  letter-spacing: 0.3px;
  animation: fadeInUp 0.9s ease-out;
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
  box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.03) inset;
  width: fit-content;
  max-width: 90%;
  min-height: 52px;
}
.tools-root .hero-admin-box { gap: 0; margin-bottom: 1.5rem; }
.tools-root .tagline-text {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255,255,255,0.85);
  margin: 0;
}
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
  justify-content: center;
  gap: 10px;
  margin-top: 1.2rem;
  padding: 9px 20px;
  background: rgba(34,197,94,0.06);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 100px;
  backdrop-filter: blur(20px);
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  animation: fadeInUp 1.2s ease-out;
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

/* Button Grid */
.tools-root .button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
  margin-top: 0.5rem;
}
.tools-root .tool-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #e0e0e0;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
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
  transform: translateY(-6px) scale(1.02);
  border-color: rgba(250,204,21,0.75);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(250,204,21,0.4), 0 0 18px rgba(250,204,21,0.35), 0 0 40px rgba(250,204,21,0.15);
  background: rgba(250,204,21,0.04);
}
.tools-root .tool-button:active { transform: translateY(-3px) scale(0.98); }

.tools-root .tool-emoji {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
  display: block;
  transition: transform 0.3s ease;
}
.tools-root .tool-button:hover .tool-emoji {
  transform: scale(1.15) rotate(3deg);
  filter: drop-shadow(0 0 10px rgba(250,204,21,0.6));
}
.tools-root .tool-label { font-size: 1rem; line-height: 1.3; }

.tools-root .badge-new,
.tools-root .badge-soon {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 10px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  border-radius: 6px;
  animation: badge-pulse 2s ease-in-out infinite;
}
.tools-root .badge-new {
  background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
  color: #000;
  box-shadow: 0 2px 12px rgba(250,204,21,0.5);
}
.tools-root .badge-soon {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(139,92,246,0.5);
}
@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 2px 12px rgba(250,204,21,0.4); }
  50% { box-shadow: 0 2px 24px rgba(250,204,21,0.9); }
}

/* Ticker */
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
.tools-root .ticker-content a:hover { text-decoration: underline; }
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
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(250,204,21,0.05);
  max-width: 800px;
  width: 90%;
}
.tools-root .motivasi-quote p {
  font-size: 1.6rem;
  font-style: italic;
  font-weight: 700;
  color: #facc15;
  margin: 0 0 0.8rem;
  line-height: 1.4;
  text-shadow: 0 0 20px rgba(250,204,21,0.3);
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
.tools-root footer p { margin: 0; letter-spacing: 0.3px; }

@media (max-width: 768px) {
  .tools-root .container { padding: 1.5rem 1rem 3rem; }
  .tools-root .hero-section { padding: 2.5rem 1.5rem; border-radius: 24px; }
  .tools-root h1 { font-size: 2.8rem; }
  .tools-root .hero-subtitle { font-size: 1rem; }
  .tools-root .button-grid { grid-template-columns: 1fr; gap: 1rem; }
  .tools-root .tool-button { padding: 1.5rem 1rem; }
  .tools-root .tool-emoji { font-size: 2rem; }
  .tools-root .motivasi-quote p { font-size: 1.2rem; }
  .tools-root .hero-admin-box { flex-direction: column; gap: 8px; padding: 14px 20px; border-radius: 20px; }
  .tools-root .admin-divider { width: 40px; height: 1.5px; }
}
`;
