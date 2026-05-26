import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";

export const SOCIAL_TOOLS: Tool[] = [
  {
    slug: "caption-instagram",
    emoji: "📸",
    label: "CAPTION INSTAGRAM",
    category: "social",
    description: "Caption Instagram yang engagement-tinggi dengan hashtag + emoji strategis.",
    fields: [
      {
        name: "topik",
        label: "Topik / Konten",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "tone",
        label: "Tone",
        kind: "select",
        default: "santai",
        options: [
          { value: "santai", label: "Santai-relatable" },
          { value: "edukatif", label: "Edukatif" },
          { value: "inspiratif", label: "Inspiratif" },
          { value: "lucu", label: "Lucu/humor" },
          { value: "promosi", label: "Promosi/jualan" },
        ],
      },
      {
        name: "panjang",
        label: "Panjang Caption",
        kind: "select",
        default: "medium",
        options: [
          { value: "short", label: "Pendek (1-2 baris)" },
          { value: "medium", label: "Sedang (3-5 baris)" },
          { value: "long", label: "Panjang (paragraf storytelling)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.85,
      maxTokens: 2000,
      systemPrompt: `Tulis caption Instagram yang ENGAGE (bukan info-dump). Generate 3 alternatif caption dengan struktur:

## Caption 1 — [Angle]
[Hook line 1] (max 7 kata, harus stop scroll)
[Body sesuai panjang yang diminta]
[Question/CTA di akhir untuk engagement]

[15 hashtag mix: 5 broad + 7 niche + 3 community]

---

## Caption 2 — [Angle Berbeda]
...

## Caption 3 — [Angle Berbeda]
...

## Pro Tips
- Best time post (untuk niche tersebut)
- Story sticker suggestion
- Reels carry-over caption (jika cocok)

Aturan emoji: max 5 per caption, pakai di tempat strategis (bukan acak).`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik}\nTone: ${input.tone}\nPanjang: ${input.panjang}`,
      outputType: "markdown",
    },
  },
  {
    slug: "caption-tiktok",
    emoji: "🎵",
    label: "CAPTION TIKTOK",
    category: "social",
    description: "Caption TikTok + hashtag + sound suggestion untuk maximum reach.",
    fields: [
      {
        name: "konsep",
        label: "Konsep Video",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "niche",
        label: "Niche",
        kind: "text",
        default: "dakwah / edukasi",
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.85,
      maxTokens: 1800,
      systemPrompt: `Tulis caption TikTok yang FYP-friendly. Generate 5 alternatif caption + 1 caption viral hook.

Aturan TikTok:
- Caption max 150 char
- 3-5 hashtag (mix broad #fyp + niche)
- Hook 3 detik pertama TERTULIS di caption
- Mention sound trend yang cocok

Output:
## Caption Variations (5)
1. [caption max 150 char] | hashtag

## VIRAL HOOK Caption
[caption super-stop-scroll]

## Sound/Audio Suggestion
- Sound trend 1: [nama] — kenapa cocok
- Sound trend 2: [nama] — kenapa cocok

## Hashtag Strategy
- 1 super-broad (#fyp #foryou)
- 2 niche (#dakwah #islamicquotes)
- 1 community (#muslimindonesia)
- 1 trending hashtag relevan

## Posting Tips
Best time + duration sweet spot untuk konten ini`,
      buildUserPrompt: (input) => `Konsep: ${input.konsep}\nNiche: ${input.niche}`,
      outputType: "markdown",
    },
  },
  {
    slug: "twitter-thread",
    emoji: "🐦",
    label: "TWITTER/X THREAD",
    category: "social",
    description: "Thread Twitter/X yang viral-worthy dengan hook + payoff structure.",
    fields: [
      {
        name: "topik",
        label: "Topik / Argumen",
        kind: "textarea",
        rows: 4,
        required: true,
      },
      {
        name: "panjang",
        label: "Panjang Thread",
        kind: "select",
        default: "medium",
        options: [
          { value: "short", label: "5-7 tweet" },
          { value: "medium", label: "10-12 tweet" },
          { value: "long", label: "15-20 tweet" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.8,
      maxTokens: 3500,
      systemPrompt: `Tulis Twitter thread yang STOPS THE SCROLL dan punya viral DNA.

Struktur thread:
- Tweet 1 (HOOK): bold claim / question / contrarian statement (max 240 char)
- Tweet 2: setup / context
- Tweet 3-N: develop arguments / examples / data
- Tweet N-1: turning point / unexpected angle
- Tweet terakhir: payoff + call to action ("RT this if helpful")

Per tweet:
- Max 280 char (HARUS dihitung)
- Mulai dengan emoji atau bullet
- 1 ide per tweet (jangan campur)
- Numbered (1/, 2/, dst)

Output:
\`\`\`
1/ [tweet 1 hook]

2/ [tweet 2]
...

N/ [tweet last]
\`\`\`

Setelah thread, beri:
- Tweet quote-able yang cocok untuk standalone post
- Hashtag (max 2)
- Best time to post`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik}\nPanjang: ${input.panjang} tweet`,
      outputType: "markdown",
    },
  },
  {
    slug: "hashtag-research",
    emoji: "#️⃣",
    label: "HASHTAG RESEARCH",
    category: "social",
    description: "Riset hashtag tier (mega/macro/niche/long-tail) untuk maximum discoverability.",
    fields: [
      {
        name: "topik",
        label: "Topik / Keyword Utama",
        kind: "text",
        required: true,
      },
      {
        name: "platform",
        label: "Platform",
        kind: "select",
        default: "instagram",
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "youtube", label: "YouTube" },
          { value: "twitter", label: "Twitter/X" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.6,
      maxTokens: 2500,
      systemPrompt: `Anda hashtag researcher. Generate hashtag set strategis dengan tier-based approach:

## Tier 1: Mega Hashtag (1M+ posts)
3 hashtag — visibility tinggi tapi kompetisi extreme. Pakai 1-2 saja untuk discovery.

## Tier 2: Macro Hashtag (100K-1M posts)
5 hashtag — sweet spot untuk reach + chance to rank.

## Tier 3: Niche Hashtag (10K-100K posts)
10 hashtag — community engagement, easier to rank top.

## Tier 4: Long-tail / Branded (< 10K posts)
7 hashtag — sangat targeted, audiens loyal.

Output per tier dengan estimasi post count + relevance score.

## Rekomendasi Mix Final
Set 25 hashtag siap copy-paste (mix dari semua tier).

## Hashtag yang HARUS DIHINDARI
List 3-5 hashtag yang banned/shadowbanned di platform tersebut untuk niche ini.`,
      buildUserPrompt: (input) => `Topik: ${input.topik}\nPlatform: ${input.platform}`,
      outputType: "markdown",
    },
  },
  {
    slug: "channel-name",
    emoji: "🏷️",
    label: "CHANNEL NAME GENERATOR",
    category: "social",
    description: "Generate 20 ide nama channel/akun yang catchy + check availability hint.",
    fields: [
      {
        name: "niche",
        label: "Niche / Topik",
        kind: "text",
        required: true,
      },
      {
        name: "vibe",
        label: "Vibe",
        kind: "select",
        default: "profesional",
        options: [
          { value: "profesional", label: "Profesional" },
          { value: "santai", label: "Santai/Friendly" },
          { value: "religi", label: "Religi/Spiritual" },
          { value: "edukatif", label: "Edukatif" },
          { value: "kreatif", label: "Kreatif/Unik" },
        ],
      },
      {
        name: "language",
        label: "Bahasa",
        kind: "select",
        default: "id",
        options: [
          { value: "id", label: "Indonesia" },
          { value: "en", label: "English" },
          { value: "mix", label: "Mix" },
          { value: "ar", label: "Arabic-influenced" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.95,
      maxTokens: 2000,
      systemPrompt: `Generate 20 nama channel/akun kreatif sesuai niche + vibe + bahasa user.

Output 4 cluster (5 nama per cluster):

## Cluster 1: Descriptive Names
Nama yang langsung deskripsikan topik

## Cluster 2: Persona-based
Pakai nama orang/karakter

## Cluster 3: Compound Words
Gabungan kata kreatif

## Cluster 4: Abstract/Unique
Nama unik yang memorable

Per nama:
- Nama channel
- Tagline 1 kalimat
- Saran handle: @nama_handle (jika tersedia)
- Why it works: [reasoning singkat]
- Pronunciation: [hint pengucapan]

## Pro Tip Akhir
1 paragraf: cara cek availability di YouTube + IG + TikTok + domain.`,
      buildUserPrompt: (input) =>
        `Niche: ${input.niche}\nVibe: ${input.vibe}\nBahasa: ${input.language}`,
      outputType: "markdown",
    },
  },
  {
    slug: "channel-bio",
    emoji: "📝",
    label: "CHANNEL BIO/DESC",
    category: "social",
    description: "Bio Instagram/TikTok + Description YouTube channel yang convert.",
    fields: [
      {
        name: "channel",
        label: "Nama Channel",
        kind: "text",
        required: true,
      },
      {
        name: "niche",
        label: "Niche/Topik Utama",
        kind: "text",
        required: true,
      },
      {
        name: "platform",
        label: "Platform",
        kind: "select",
        default: "all",
        options: [
          { value: "all", label: "Semua (IG+TikTok+YT)" },
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "youtube", label: "YouTube" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.75,
      maxTokens: 2500,
      systemPrompt: `Generate bio/description profil yang convert (bukan generic).

## Instagram Bio (max 150 char)
3 alternatif:
- Versi 1: emoji + tagline + CTA
- Versi 2: question hook + benefit
- Versi 3: numbered specialty

## TikTok Bio (max 80 char)
2 alternatif super pendek

## YouTube Description Channel (500-1000 kata)
Struktur:
- Paragraf 1: hook + apa channel ini
- Paragraf 2: untuk siapa + benefit
- Paragraf 3: jadwal upload + apa yang bisa diharapkan
- Section "🔗 Find me on:" dengan placeholder link
- Section "📩 Business inquiries:" dengan placeholder email
- 5-10 keyword SEO di paragraf akhir natural

## Twitter/X Bio (max 160 char)
2 alternatif

## Pro Tips
- Saran link in bio (linktree alternative)
- Profile pic suggestion`,
      buildUserPrompt: (input) =>
        `Channel: ${input.channel}\nNiche: ${input.niche}\nPlatform: ${input.platform}`,
      outputType: "markdown",
    },
  },
  {
    slug: "podcast-script",
    emoji: "🎧",
    label: "PODCAST SCRIPT",
    category: "konten",
    description: "Naskah podcast 15-60 menit dengan struktur intro-konten-outro.",
    fields: [
      {
        name: "topik",
        label: "Topik Episode",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "format",
        label: "Format Podcast",
        kind: "select",
        default: "solo",
        options: [
          { value: "solo", label: "Solo/Monolog" },
          { value: "interview", label: "Interview (host + guest)" },
          { value: "duo", label: "Duo (2 host)" },
          { value: "panel", label: "Panel Diskusi (3+ orang)" },
        ],
      },
      {
        name: "durasi",
        label: "Durasi Target",
        kind: "select",
        default: "30min",
        options: [
          { value: "15min", label: "15 menit (mini)" },
          { value: "30min", label: "30 menit (standar)" },
          { value: "60min", label: "60 menit (long-form)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: "anthropic/claude-opus-4.7",
      temperature: 0.75,
      maxTokens: 5000,
      systemPrompt: `Tulis naskah podcast lengkap dengan struktur:

## 0:00-1:00 INTRO
- Cold open hook (10-15 detik)
- Tagline channel + sponsor space
- Preview "Hari ini kita akan bahas..."

## 1:00-3:00 SETUP
- Konteks topik
- Mengapa relevan sekarang

## 3:00-N:00 KONTEN UTAMA
Pecah jadi 3-5 segment dengan:
- Heading segment
- Talking points
- Anekdot/cerita
- (Untuk interview) pertanyaan kunci

## N-3:00 KEY TAKEAWAYS
- 3 poin utama yang harus diingat

## N-2:00 CTA
- Subscribe/follow
- Tinggalkan review
- Topik request next episode

## OUTRO
- Tagline closing

Annotation:
- [pause 2s]
- [music up/down]
- [sound effect: ...]

Plus output di bawah:
## Show Notes
- Bullet points untuk YouTube description
- Timestamp chapters
- Resources mentioned`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik}\nFormat: ${input.format}\nDurasi: ${input.durasi}`,
      outputType: "markdown",
    },
  },
];
