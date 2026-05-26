import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";
const OPUS = "anthropic/claude-opus-4.7";

export const PRODUKTIVITAS_TOOLS: Tool[] = [
  {
    slug: "ebook-writer",
    emoji: "📚",
    label: "EBOOK WRITER",
    category: "produktivitas",
    description: "Outline + draft ebook dakwah/edukasi 30-100 halaman dari ide awal.",
    badge: "NEW",
    fields: [
      {
        name: "topik",
        label: "Topik Ebook",
        kind: "textarea",
        rows: 3,
        placeholder: "Contoh: 30 hari menjadi muslim produktif",
        required: true,
      },
      {
        name: "audiens",
        label: "Target Pembaca",
        kind: "text",
        default: "muslim Indonesia 20-40 tahun",
      },
      {
        name: "halaman",
        label: "Target Panjang",
        kind: "select",
        default: "50",
        options: [
          { value: "30", label: "30 halaman (mini ebook)" },
          { value: "50", label: "50 halaman (standar)" },
          { value: "100", label: "100 halaman (lengkap)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.7,
      maxTokens: 6000,
      systemPrompt: `Anda book editor profesional. Tugas: bangun outline ebook + draft chapter pertama.

Output:
## Cover Concept
- Judul utama (max 8 kata)
- Subjudul (max 12 kata, klarifikasi benefit)
- Tagline cover

## Daftar Isi (Table of Contents)
Outline lengkap chapter:
- Pengantar
- Chapter 1-N (sesuai jumlah halaman)
  - Sub-bab per chapter (3-5 sub)
  - Estimasi halaman per chapter
- Penutup
- Lampiran

## Sample Chapter (Chapter 1 lengkap)
Tulis chapter 1 lengkap dengan:
- Pembuka chapter
- Body 5-8 paragraf
- Quote/dalil pendukung
- Action items / refleksi
- Closing menuju chapter 2

## Marketing Copy
- Back cover blurb (200 kata)
- 3 testimonial template
- Lead magnet idea (free PDF preview chapter)`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik}\nAudiens: ${input.audiens}\nPanjang: ${input.halaman} halaman`,
      outputType: "markdown",
    },
  },
  {
    slug: "course-curriculum",
    emoji: "🎓",
    label: "COURSE CURRICULUM",
    category: "produktivitas",
    description: "Kurikulum kursus online lengkap (silabus + modul + assessment).",
    fields: [
      {
        name: "topik",
        label: "Topik Kursus",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "level",
        label: "Level",
        kind: "select",
        default: "beginner",
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
        ],
      },
      {
        name: "durasi",
        label: "Total Durasi",
        kind: "select",
        default: "8h",
        options: [
          { value: "2h", label: "2 jam (mini course)" },
          { value: "8h", label: "8 jam (standar)" },
          { value: "20h", label: "20 jam (intensif)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.7,
      maxTokens: 5500,
      systemPrompt: `Anda instructional designer. Buat kurikulum kursus lengkap dengan struktur:

## Course Overview
- Judul kursus
- Audiens target
- Prerequisites
- Learning outcomes (5 spesifik measurable)

## Curriculum Map
Pecah jadi 4-8 modul, per modul:

### Modul N: [Judul]
- Durasi: X menit
- Format: video/text/quiz/exercise
- Learning objectives (3 spesifik)
- Materi:
  - Topic 1
  - Topic 2
  - ...
- Assessment: quiz/assignment/project
- Resources: 2-3 reference

## Final Project / Capstone
Project akhir yang demonstrate semua skill yang diajarkan.

## Marketing Outline
- Tagline
- 3 selling points
- Sertifikat completion description`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik}\nLevel: ${input.level}\nDurasi: ${input.durasi}`,
      outputType: "markdown",
    },
  },
  {
    slug: "newsletter-writer",
    emoji: "📧",
    label: "NEWSLETTER WRITER",
    category: "produktivitas",
    description: "Newsletter mingguan/bulanan dengan struktur engage + retention.",
    fields: [
      {
        name: "tema",
        label: "Tema Newsletter",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "frekuensi",
        label: "Frekuensi",
        kind: "select",
        default: "weekly",
        options: [
          { value: "weekly", label: "Mingguan" },
          { value: "biweekly", label: "Dua mingguan" },
          { value: "monthly", label: "Bulanan" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.75,
      maxTokens: 3500,
      systemPrompt: `Tulis newsletter dengan format yang engage, struktur:

## Subject Line
3 alternatif subject line yang bikin email DIBUKA (curiosity, benefit, FOMO)

## Preview Text
1 baris max 90 char untuk inbox preview

## Newsletter Body

### 👋 Hi [Name],
Personal opener (2 kalimat hangat)

### 🌟 Topik Minggu Ini
Main content (300-500 kata)

### 📚 Resources
3 link/resource minggu ini (description 1 kalimat each)

### 💭 Quote of the Week
1 quote inspiratif + atribusi

### ❓ Question for You
1 pertanyaan ke pembaca untuk reply (boost engagement)

### CTA
1 ajakan jelas (subscribe lebih, rekomendasi friend, cek artikel)

### Salam Penutup
2 kalimat hangat + signature

## Pro Tips
- Best send time
- Subject A/B test suggestions
- Personalization tag suggestions`,
      buildUserPrompt: (input) =>
        `Tema: ${input.tema}\nFrekuensi: ${input.frekuensi}`,
      outputType: "markdown",
    },
  },
  {
    slug: "blog-article",
    emoji: "✍️",
    label: "BLOG ARTICLE WRITER",
    category: "produktivitas",
    description: "Artikel blog SEO-optimized 1500-3000 kata dengan H2/H3 structure.",
    fields: [
      {
        name: "topik",
        label: "Topik Artikel",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "keyword",
        label: "Target Keyword",
        kind: "text",
        required: true,
      },
      {
        name: "panjang",
        label: "Panjang Artikel",
        kind: "select",
        default: "2000",
        options: [
          { value: "1000", label: "1000 kata (singkat)" },
          { value: "2000", label: "2000 kata (standar)" },
          { value: "3000", label: "3000 kata (in-depth)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.7,
      maxTokens: 6500,
      systemPrompt: `Tulis artikel blog SEO-optimized untuk WordPress/Medium. Struktur:

## Meta
- Meta title (max 60 char, keyword di awal)
- Meta description (max 160 char)
- URL slug
- Featured image alt text

## Article Body

# H1 (judul utama, sama dengan meta title atau variasi)

## Introduction (200 kata)
Hook + statement of intent + preview

## H2 Section 1
2-3 paragraf, sertakan keyword 1x natural

### H3 Sub-section
Detail breakdown

## H2 Section 2
...

[Lanjut dengan 4-6 H2 sections sesuai panjang]

## FAQ Section
3-5 pertanyaan related (PAA-style untuk featured snippet)

## Conclusion
Summary + CTA

## Author Box
Bio singkat 1 paragraf

## SEO Notes
- Internal link suggestions (2-3)
- External link suggestions (2-3 dari source authority)
- Schema markup type recommendation`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik}\nKeyword: ${input.keyword}\nPanjang: ${input.panjang} kata`,
      outputType: "markdown",
    },
  },
  {
    slug: "email-marketing",
    emoji: "📨",
    label: "EMAIL MARKETING",
    category: "produktivitas",
    description: "Email marketing series (welcome/nurture/sales) dengan high open-rate.",
    fields: [
      {
        name: "produk",
        label: "Produk / Service",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "jenis",
        label: "Jenis Email Series",
        kind: "select",
        default: "welcome",
        options: [
          { value: "welcome", label: "Welcome Series (5 email)" },
          { value: "nurture", label: "Nurture Series (7 email)" },
          { value: "sales", label: "Sales Series (5 email)" },
          { value: "abandoned", label: "Abandoned Cart (3 email)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.75,
      maxTokens: 5000,
      systemPrompt: `Tulis email series marketing dengan high engagement.

Untuk setiap email:

## Email N: [Tujuan Email]
- **Send Day**: Day 0 / Day 1 / Day 3 / etc
- **Subject Line**: 3 alternatif
- **Preview Text**: 1 baris
- **Body**:
  - Personal opener
  - Main content (problem-agitate-solve atau story-based)
  - CTA
  - PS line (often higher CTR than body)
- **CTA Button Copy**
- **Why This Works**: 1 kalimat reasoning

## Sequence Logic
- Trigger setiap email
- Tag/segmentation strategy
- A/B test variables yang disarankan`,
      buildUserPrompt: (input) =>
        `Produk: ${input.produk}\nJenis: ${input.jenis}`,
      outputType: "markdown",
    },
  },
  {
    slug: "sales-page",
    emoji: "💰",
    label: "SALES PAGE COPY",
    category: "produktivitas",
    description: "Copy lengkap sales page (long-form) dengan AIDA + objection handling.",
    fields: [
      {
        name: "produk",
        label: "Produk + Harga",
        kind: "textarea",
        rows: 4,
        placeholder: "Contoh: Ebook 30 Hari Muslim Produktif - Rp 99.000",
        required: true,
      },
      {
        name: "audiens",
        label: "Target Audiens (pain points)",
        kind: "textarea",
        rows: 3,
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.75,
      maxTokens: 5000,
      systemPrompt: `Tulis sales page long-form dengan struktur konversi tinggi:

## 1. Pre-Headline (problem agitator)

## 2. Headline (BIG promise)
3 alternatif

## 3. Sub-Headline (clarification)

## 4. Hero Section
- 1 kalimat ekspansi headline
- CTA pertama

## 5. Problem Agitation
3 paragraf yang bikin pembaca mengangguk "iya banget gw"

## 6. Solution Reveal
Introduce produk + transformation promise

## 7. Benefits (Bullet List)
10 bullet "you'll learn" / "you'll get"

## 8. Social Proof
- 3 testimonial template
- Numbers (X students, Y reviews)

## 9. About Author
Why credible

## 10. What's Inside
Detailed breakdown produk

## 11. Pricing
- Anchor price (coret)
- Final price
- Payment options
- Bonus stack (3 bonus + value each)

## 12. Guarantee
30-day money-back atau policy

## 13. FAQ
8 common objections answered

## 14. Final CTA
Strong, urgent

## 15. PS Section
1-2 PS reminder

## Pro Tips
- Saran video sales (VSL) intro
- Exit intent popup copy
- Retargeting ad copy`,
      buildUserPrompt: (input) =>
        `Produk: ${input.produk}\n\nAudiens: ${input.audiens}`,
      outputType: "markdown",
    },
  },
  {
    slug: "translate-id-en",
    emoji: "🌐",
    label: "TRANSLATOR ID-EN",
    category: "produktivitas",
    description: "Penerjemah ID↔EN konteks-aware (formal/casual/teknis/religi).",
    fields: [
      {
        name: "text",
        label: "Teks untuk Diterjemahkan",
        kind: "textarea",
        rows: 6,
        required: true,
      },
      {
        name: "arah",
        label: "Arah Translate",
        kind: "select",
        default: "id-to-en",
        options: [
          { value: "id-to-en", label: "Indonesia → English" },
          { value: "en-to-id", label: "English → Indonesia" },
          { value: "ar-to-id", label: "Arabic → Indonesia" },
        ],
      },
      {
        name: "konteks",
        label: "Konteks/Tone",
        kind: "select",
        default: "general",
        options: [
          { value: "general", label: "Umum" },
          { value: "formal", label: "Formal/Bisnis" },
          { value: "casual", label: "Casual/Conversational" },
          { value: "religi", label: "Religi/Islamic" },
          { value: "teknis", label: "Teknis/Akademik" },
          { value: "kreatif", label: "Kreatif/Sastra" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.4,
      maxTokens: 3000,
      systemPrompt: `Anda translator profesional yang konteks-aware. Translate dengan akurasi makna + nuansa budaya.

Output format:

## Translation
[Hasil terjemahan utama]

## Alternative Translations (jika ada nuance berbeda)
1. [versi alternatif 1] — [penjelasan kapan dipakai]
2. [versi alternatif 2] — [penjelasan]

## Cultural/Linguistic Notes
- Idiom/expression yang tidak literal di-translate (jelaskan)
- Word choice rationale untuk istilah krusial
- Suggestion untuk konteks lain

## Word-by-Word (untuk teks pendek)
[Jika teks <50 kata, breakdown per kata kunci]

PENTING: Pertahankan tone aslinya. Untuk religi: pastikan terminologi Islam akurat (jangan generic).`,
      buildUserPrompt: (input) =>
        `Arah: ${input.arah}\nKonteks: ${input.konteks}\n\nText:\n${input.text}`,
      outputType: "markdown",
    },
  },
  {
    slug: "summarizer",
    emoji: "📝",
    label: "TEXT SUMMARIZER",
    category: "produktivitas",
    description: "Ringkas teks panjang/artikel/transkrip jadi key points + executive summary.",
    fields: [
      {
        name: "text",
        label: "Teks Panjang",
        kind: "textarea",
        rows: 12,
        placeholder: "Tempel artikel, transkrip, atau dokumen panjang",
        required: true,
      },
      {
        name: "format",
        label: "Format Ringkasan",
        kind: "select",
        default: "bullets",
        options: [
          { value: "bullets", label: "Bullet Points (5-7)" },
          { value: "executive", label: "Executive Summary (1 paragraf)" },
          { value: "tldr", label: "TL;DR (3 kalimat)" },
          { value: "detailed", label: "Detailed (multi-section)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.3,
      maxTokens: 2500,
      systemPrompt: `Ringkas teks user dengan akurat. Output format sesuai pilihan.

Untuk SEMUA format, sertakan di bawahnya:
## Key Insights (3)
3 insight non-obvious dari teks

## Action Items (jika ada)
3 takeaway yang actionable

## Related Topics
3 topik terkait yang bisa dieksplor lanjut`,
      buildUserPrompt: (input) =>
        `Format: ${input.format}\n\nText:\n${input.text}`,
      outputType: "markdown",
    },
  },
  {
    slug: "meeting-notes",
    emoji: "📋",
    label: "MEETING NOTES",
    category: "produktivitas",
    description: "Format transkrip rapat jadi notes profesional dengan action items.",
    fields: [
      {
        name: "transkrip",
        label: "Transkrip Rapat",
        kind: "textarea",
        rows: 12,
        required: true,
      },
      {
        name: "topik",
        label: "Topik Rapat",
        kind: "text",
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.3,
      maxTokens: 3500,
      systemPrompt: `Format transkrip rapat jadi meeting notes profesional:

## Meeting Info
- Tanggal/waktu (estimasi)
- Topik utama
- Peserta (extract dari transkrip)

## Agenda
List topik yang dibahas (3-5 poin)

## Diskusi Utama
Per topik: 2-3 kalimat ringkas + decision

## Decisions Made
List keputusan yang diambil + responsible person

## Action Items
| # | Action | PIC | Deadline | Priority |
|---|--------|-----|----------|----------|

## Open Questions / Parking Lot
Pertanyaan yang belum terjawab / akan dibahas next meeting

## Next Meeting
- Tanggal proposal
- Topik prioritas

PENTING: Akurat dari transkrip. Jangan invent decision yang tidak ada.`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik || "(deduce dari transkrip)"}\n\nTranskrip:\n${input.transkrip}`,
      outputType: "markdown",
    },
  },
  {
    slug: "name-generator",
    emoji: "🎯",
    label: "BUSINESS NAME",
    category: "produktivitas",
    description: "Nama bisnis/startup/produk + tagline + domain availability check hint.",
    fields: [
      {
        name: "bisnis",
        label: "Jenis Bisnis/Produk",
        kind: "textarea",
        rows: 3,
        required: true,
      },
      {
        name: "vibe",
        label: "Vibe Brand",
        kind: "select",
        default: "modern",
        options: [
          { value: "modern", label: "Modern/Tech" },
          { value: "trad", label: "Traditional/Heritage" },
          { value: "fun", label: "Fun/Playful" },
          { value: "premium", label: "Premium/Luxury" },
          { value: "religi", label: "Religi/Spiritual" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.95,
      maxTokens: 2500,
      systemPrompt: `Generate 25 nama bisnis kreatif untuk produk/jasa user.

Output 5 cluster (5 nama per cluster):

## Cluster 1: Descriptive
## Cluster 2: Founder/Persona-based
## Cluster 3: Compound (gabungan kata)
## Cluster 4: Abstract/Made-up
## Cluster 5: Acronym/Initial

Per nama:
- Nama brand
- Tagline (max 8 kata)
- Domain saran: .com / .id / .co / dll
- Pronunciation hint
- Why it works

## Top 3 Recommendation
Pilih 3 terbaik berdasarkan: memorable + scalable + availability

## Domain Check Tips
- 3 cara cek availability cepat
- Alternative TLD strategy`,
      buildUserPrompt: (input) =>
        `Bisnis: ${input.bisnis}\nVibe: ${input.vibe}`,
      outputType: "markdown",
    },
  },
  {
    slug: "swot-analysis",
    emoji: "📊",
    label: "SWOT ANALYSIS",
    category: "produktivitas",
    description: "SWOT analysis lengkap untuk bisnis/personal/proyek + action plan.",
    fields: [
      {
        name: "subject",
        label: "Subjek Analisa",
        kind: "textarea",
        rows: 4,
        placeholder: "Contoh: Channel YouTube dakwah saya, atau Bisnis kursus online",
        required: true,
      },
      {
        name: "konteks",
        label: "Konteks Tambahan",
        kind: "textarea",
        rows: 3,
        placeholder: "Posisi sekarang, tantangan, goal",
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.65,
      maxTokens: 3500,
      systemPrompt: `Lakukan SWOT analysis komprehensif:

## Strengths (Kekuatan Internal)
List 5-7 strengths spesifik (bukan generic). Per item: 1-2 kalimat.

## Weaknesses (Kelemahan Internal)
List 5-7 weaknesses. Honest, jangan sugarcoat.

## Opportunities (Peluang Eksternal)
List 5-7 opportunities yang bisa diambil.

## Threats (Ancaman Eksternal)
List 5-7 threats yang perlu di-mitigate.

## SWOT Matrix (TOWS Strategic)
- **SO Strategy**: Pakai S untuk capture O (3 strategy)
- **WO Strategy**: Atasi W untuk akses O (3 strategy)
- **ST Strategy**: Pakai S untuk hindari T (3 strategy)
- **WT Strategy**: Minimize W + avoid T (3 strategy)

## Top 5 Action Items (90 hari ke depan)
Prioritas action konkret yang harus dijalankan.

## Metrics to Track
3-5 metric untuk validate progress.`,
      buildUserPrompt: (input) =>
        `Subjek: ${input.subject}\n\nKonteks: ${input.konteks || "(tidak disebut)"}`,
      outputType: "markdown",
    },
  },
  {
    slug: "code-explainer",
    emoji: "💻",
    label: "CODE EXPLAINER",
    category: "produktivitas",
    description: "Jelaskan code dalam bahasa Indonesia step-by-step (untuk pemula/non-dev).",
    fields: [
      {
        name: "code",
        label: "Code Snippet",
        kind: "textarea",
        rows: 10,
        placeholder: "Tempel kode (JS, Python, PHP, dll)",
        required: true,
      },
      {
        name: "level",
        label: "Level Penjelasan",
        kind: "select",
        default: "pemula",
        options: [
          { value: "pemula", label: "Pemula (no jargon)" },
          { value: "intermediate", label: "Intermediate" },
          { value: "expert", label: "Expert (deep dive)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: "anthropic/claude-sonnet-4.6",
      temperature: 0.4,
      maxTokens: 3500,
      systemPrompt: `Jelaskan kode dalam bahasa Indonesia yang mudah dipahami. Format:

## Apa Code Ini Ngapain?
1 paragraf overview (no jargon)

## Step-by-Step Breakdown
Per blok kode:
- Code line(s)
- Penjelasan dalam bahasa awam

## Konsep yang Dipakai
List konsep programming yang relevan (e.g. async, recursion, etc) dengan analogi sederhana.

## Improvement Suggestions
2-3 saran perbaikan kode (readability, performance, security).

## Common Pitfalls
Apa yang sering salah di kode seperti ini.`,
      buildUserPrompt: (input) =>
        `Level: ${input.level}\n\nCode:\n\`\`\`\n${input.code}\n\`\`\``,
      outputType: "markdown",
    },
  },
];
