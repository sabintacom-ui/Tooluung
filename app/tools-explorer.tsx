"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type ToolItem = {
  slug: string;
  emoji: string;
  label: string;
  description: string;
  category: string;
  badge?: "NEW" | "BETA";
};

type FeaturedItem = {
  emoji: string;
  label: string;
  description: string;
  href: string;
  badge?: "NEW" | "BETA";
};

type Props = {
  tools: ToolItem[];
  featured: FeaturedItem[];
  categoryOrder: string[];
  categoryLabels: Record<string, string>;
};

const SIMULATED_PROMPTS = [
  {
    emoji: "🎨",
    title: "AI Creative Studio",
    prompt: "A futuristic holographic digital art workspace interface displaying creative design screens, neon teal and gold glowing neural connections, abstract 3D geometric structures, Islamic calligraphy vector patterns integrated with glowing light beams, high-tech, cybernetic studio setup, dark background, premium glassmorphism overlay, --ar 16:9 --v 6.0",
    image: "/gemini-image-gen.png",
    ratio: "1:1",
    style: "Studio Render"
  },
  {
    emoji: "🕌",
    title: "Cyberpunk Masjid",
    prompt: "A breathtaking cyberpunk mosque at night under a starry neon sky, towering minarets emitting teal laser beams, glowing gold geometric domes, glassmorphism architecture reflections, hyper-detailed, --ar 16:9 --v 6.0",
    image: "/cyberpunk-masjid.png",
    ratio: "1:1",
    style: "Cyber Neon"
  },
  {
    emoji: "📜",
    title: "Stained Calligraphy",
    prompt: "Beautiful Islamic calligraphy embedded inside an intricate colorful stained glass window, light rays shining through casting geometric shadows, highly detailed architectural art, warm gold and soft teal color palette, photorealistic, --ar 16:9 --v 6.0",
    image: "/calligraphy-glass.png",
    ratio: "1:1",
    style: "Stained Glass"
  },
  {
    emoji: "🧬",
    title: "Abstract Pipeline",
    prompt: "Futuristic 3D abstract workflow illustrating automated pipelines, neural networks node graph connecting, glassmorphism panel interfaces, teal and gold glows, --ar 16:9 --v 6.0",
    image: "/hero-illustration.png",
    ratio: "16:9",
    style: "3D Motion Graphic"
  }
];

export function ToolsExplorer({ tools, featured, categoryOrder, categoryLabels }: Props) {
  const [query, setQuery] = useState("");
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  const handleSelectPrompt = (idx: number) => {
    if (idx === selectedPromptIdx) return;
    setIsRendering(true);
    setTimeout(() => {
      setSelectedPromptIdx(idx);
      setIsRendering(false);
    }, 600);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [tools, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, ToolItem[]>();
    for (const t of filtered) {
      const arr = m.get(t.category) || [];
      arr.push(t);
      m.set(t.category, arr);
    }
    return m;
  }, [filtered]);

  const showFeatured = !query.trim();
  const totalTools = featured.length + tools.length;
  const filteredCount = filtered.length;

  return (
    <>
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{totalTools}</div>
          <div className="stat-label">Total Tools</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{categoryOrder.length}</div>
          <div className="stat-label">Kategori</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">2</div>
          <div className="stat-label">Pipeline Otomatis</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">06:00</div>
          <div className="stat-label">Daily Cron WIB</div>
        </div>
      </div>

      {/* Interactive prompt simulator preview */}
      <div className="prompt-simulator-card">
        <div className="simulator-header">
          <div className="sim-badge">🎨 PREVIEW STUDIO</div>
          <h3>Gemini 3.5 Image Engine</h3>
          <p>Ketik ide prompt Anda atau pilih preset inspiratif di bawah untuk memvisualisasikan dakwah & edukasi secara modern.</p>
        </div>

        <div className="simulator-grid">
          <div className="simulator-left">
            <span className="sim-label">PRESENTS & INSPIRASI PRESET</span>
            <div className="prompt-pills">
              {SIMULATED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  className={`prompt-pill ${selectedPromptIdx === idx ? "active" : ""}`}
                  onClick={() => handleSelectPrompt(idx)}
                >
                  <span className="pill-emoji">{item.emoji}</span>
                  <span className="pill-title">{item.title}</span>
                </button>
              ))}
            </div>

            <span className="sim-label">PROMPT GENERATOR FORMAT</span>
            <div className="prompt-input-box">
              <span className="prompt-prefix">/imagine prompt:</span>
              <p className="prompt-text-val">{SIMULATED_PROMPTS[selectedPromptIdx].prompt}</p>
            </div>

            <div className="sim-info-footer">
              ✦ Output dioptimalkan khusus untuk model text-to-image termutakhir.
            </div>
          </div>

          <div className="simulator-right">
            <div className="sim-render-viewport">
              {isRendering && (
                <div className="sim-loader-overlay">
                  <div className="sim-spinner"></div>
                  <span className="sim-loader-text">Generating Artwork...</span>
                </div>
              )}
              <img
                src={SIMULATED_PROMPTS[selectedPromptIdx].image}
                alt={SIMULATED_PROMPTS[selectedPromptIdx].title}
                className="sim-rendered-img"
              />
              <div className="sim-rendered-meta">
                <span className="sim-meta-tag">{SIMULATED_PROMPTS[selectedPromptIdx].style}</span>
                <span className="sim-meta-tag">{SIMULATED_PROMPTS[selectedPromptIdx].ratio}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-wrapper">
        <span className="search-icon">🔎</span>
        <input
          className="search-input"
          type="text"
          placeholder="Cari tool... (nama, kategori, atau topik)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={false}
        />
        {query ? (
          <button
            className="search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {query ? (
        <div className="search-result-info">
          {filteredCount === 0
            ? "Tidak ada tool yang cocok"
            : `Menampilkan ${filteredCount} tool`}{" "}
          untuk "<strong>{query}</strong>"
        </div>
      ) : null}

      {/* Category Nav (sticky) */}
      {!query.trim() ? (
        <nav className="category-nav">
          <a className="category-pill" href="#featured">⚡ Featured</a>
          {categoryOrder.map((cat) => {
            const count = (grouped.get(cat) || []).length;
            if (count === 0) return null;
            return (
              <a key={cat} className="category-pill" href={`#cat-${cat}`}>
                {categoryLabels[cat]?.split(" ")[0] || cat} ({count})
              </a>
            );
          })}
        </nav>
      ) : null}

      {/* Featured */}
      {showFeatured ? (
        <div id="featured">
          <h2 className="section-title">⚡ Featured · Pipeline Otomatis</h2>
          <div className="button-grid">
            {featured.map((tool, idx) => (
              <ToolCard key={tool.label} {...tool} idx={idx} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Tools by Category */}
      {categoryOrder.map((cat) => {
        const list = grouped.get(cat) || [];
        if (list.length === 0) return null;
        return (
          <div key={cat} id={`cat-${cat}`}>
            <h2 className="section-title">{categoryLabels[cat] || cat}</h2>
            <div className="button-grid">
              {list.map((tool, idx) => (
                <ToolCard
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  emoji={tool.emoji}
                  label={tool.label}
                  description={tool.description}
                  badge={tool.badge}
                  idx={idx}
                />
              ))}
            </div>
          </div>
        );
      })}

      {filteredCount === 0 && query ? (
        <div className="empty-state">
          <div className="empty-emoji">🔍</div>
          <h3>Tidak menemukan tool</h3>
          <p>
            Coba kata kunci lain seperti: "skrip", "thumbnail", "doa", "tafsir",
            "musik", "seo"
          </p>
          <button className="btn-clear" onClick={() => setQuery("")}>
            Tampilkan Semua Tools
          </button>
        </div>
      ) : null}
    </>
  );
}

function ToolCard({
  href,
  emoji,
  label,
  description,
  badge,
  idx,
}: {
  href: string;
  emoji: string;
  label: string;
  description?: string;
  badge?: string;
  idx: number;
}) {
  const style = { animationDelay: `${Math.min(idx * 0.02, 0.6)}s` } as React.CSSProperties;
  return (
    <Link href={href} className="tool-button" style={style} title={description}>
      <span className="tool-emoji">{emoji}</span>
      <span className="tool-label">{label}</span>
      {description ? <span className="tool-desc">{description}</span> : null}
      {badge ? <div className={`badge-${badge.toLowerCase()}`}>{badge}</div> : null}
    </Link>
  );
}
