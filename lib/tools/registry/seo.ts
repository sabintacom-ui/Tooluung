import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";
const OPUS = "anthropic/claude-opus-4.7";

export const SEO_TOOLS: Tool[] = [
  {
    slug: "asisten-seo-yt",
    emoji: "📺",
    label: "ASISTEN SEO YT",
    category: "seo",
    description: "Optimasi SEO YouTube: judul, deskripsi, tag, hashtag dari topik video.",
    fields: [
      {
        name: "topic",
        label: "Topik / Inti Video",
        kind: "textarea",
        rows: 3,
        placeholder: "Contoh: Tutorial shalat tahajud lengkap, niat doa dan keutamaan",
        required: true,
      },
      {
        name: "keyword",
        label: "Target Keyword Utama",
        kind: "text",
        placeholder: "shalat tahajud",
      },
      {
        name: "audience",
        label: "Target Audiens",
        kind: "text",
        default: "muslim Indonesia",
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.65,
      maxTokens: 2500,
      systemPrompt: `Anda adalah YouTube SEO specialist Indonesia. Hasilkan paket SEO lengkap untuk satu video.

Output format markdown:

## 5 Pilihan Judul
5 judul (max 60 char), urut dari yang paling SEO-optimized:
- Judul 1: [judul] — alasan
- ...

## Deskripsi (350-500 kata)
- Paragraf 1 (3 kalimat): hook + benefit + keyword utama 2x
- Paragraf 2-3: konten detail
- 4-6 timestamp chapter (00:00 Pengantar, dst)
- Section "🔗 Link & Sumber" placeholder
- CTA subscribe + bell

## 20 Tag (urut prioritas)
keyword variants, longtail, related

## 7 Hashtag
3 broad + 3 niche + 1 channel-specific

## Catatan SEO
- Search intent yang ditarget
- Competitor angle yang dihindari
- Saran thumbnail copy (max 4 kata) sesuai SEO`,
      buildUserPrompt: (input) =>
        `Topik video: ${input.topic}
Target keyword: ${input.keyword || "(otomatis dari topik)"}
Audiens: ${input.audience}`,
      outputType: "markdown",
    },
  },
  {
    slug: "asisten-seo",
    emoji: "🔍",
    label: "ASISTEN SEO",
    category: "seo",
    description: "SEO universal — bisa dipakai untuk YouTube, TikTok, blog, atau marketplace.",
    fields: [
      {
        name: "platform",
        label: "Platform Target",
        kind: "select",
        default: "youtube",
        options: [
          { value: "youtube", label: "YouTube" },
          { value: "tiktok", label: "TikTok" },
          { value: "instagram", label: "Instagram" },
          { value: "blog", label: "Blog / Web Article" },
          { value: "shopee", label: "Shopee/Tokopedia listing" },
        ],
      },
      {
        name: "content",
        label: "Konten / Topik",
        kind: "textarea",
        rows: 4,
        required: true,
      },
      {
        name: "keyword",
        label: "Keyword Utama",
        kind: "text",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.65,
      maxTokens: 2500,
      systemPrompt: `Anda adalah SEO multi-platform specialist Indonesia.
Hasilkan paket SEO sesuai platform target. Format markdown bab-bab.

Untuk YouTube/TikTok/IG: judul/caption, hashtag, tag, timing post.
Untuk Blog: meta title, meta description, slug URL, H1-H3 outline, internal link suggestion, FAQ section.
Untuk Shopee/Tokopedia: nama produk SEO, deskripsi panjang, 5 fitur utama, tag pencarian.

Selalu: identifikasi search intent + saran 3 secondary keyword.`,
      buildUserPrompt: (input) =>
        `Platform: ${input.platform}
Konten: ${input.content}
Keyword utama: ${input.keyword}`,
      outputType: "markdown",
    },
  },
  {
    slug: "judul-deskripsi-tag",
    emoji: "✍️",
    label: "JUDUL, DESKRIPSI & TAG",
    category: "seo",
    description: "Generate paket judul/deskripsi/tag YouTube dari skrip atau topik singkat.",
    fields: [
      {
        name: "input",
        label: "Skrip / Topik / Outline",
        kind: "textarea",
        rows: 6,
        placeholder: "Tempel skrip lengkap atau outline kasar",
        required: true,
      },
      {
        name: "category",
        label: "Kategori Video",
        kind: "select",
        default: "education",
        options: [
          { value: "education", label: "Edukasi" },
          { value: "entertainment", label: "Hiburan" },
          { value: "religion", label: "Agama / Dakwah" },
          { value: "lifestyle", label: "Lifestyle / Vlog" },
          { value: "tutorial", label: "Tutorial / How-to" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.7,
      maxTokens: 2200,
      systemPrompt: `Anda adalah YouTube package generator. Output cepat dan praktis tanpa banyak penjelasan.

Format markdown:
## Judul (3 pilihan)
1. [judul]
2. [judul]
3. [judul]

## Deskripsi
Paragraf hook (2 kalimat) + konten ringkas + CTA. 200-350 kata.

## Tag (15 tag, dipisahkan koma)
keyword utama, variant1, variant2, longtail, related, ...

## Hashtag (5)
#tag1 #tag2 #tag3 #tag4 #tag5`,
      buildUserPrompt: (input) =>
        `Konten: ${input.input}
Kategori: ${input.category}

Generate paket lengkap.`,
      outputType: "markdown",
    },
  },
];
