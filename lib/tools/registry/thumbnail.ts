import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";

export const THUMBNAIL_TOOLS: Tool[] = [
  {
    slug: "thumbnail-maker-site",
    emoji: "📐",
    label: "THUMBNAIL MAKER (SITE)",
    category: "thumbnail",
    description: "Konsep thumbnail lengkap: copy, visual, palette, layout grid.",
    fields: [
      {
        name: "title",
        label: "Judul Video",
        kind: "text",
        required: true,
      },
      {
        name: "audience",
        label: "Target Audiens",
        kind: "text",
        default: "muslim Indonesia 18-35",
      },
      {
        name: "vibe",
        label: "Vibe Channel",
        kind: "select",
        default: "edukatif",
        options: [
          { value: "edukatif", label: "Edukatif Profesional" },
          { value: "viral", label: "Viral Curiosity" },
          { value: "kalem", label: "Kalem Estetik" },
          { value: "dramatis", label: "Dramatis Bold" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.8,
      maxTokens: 3000,
      systemPrompt: `Anda adalah thumbnail strategist YouTube. Hasilkan 3 konsep thumbnail berbeda angle, masing-masing meliputi:

\`\`\`
## Konsep N — [Nama Konsep]

**Hook Copy** (max 4 kata, huruf besar): [COPY]
**Sub Copy** (opsional, max 6 kata): [sub]

**Visual Composition**
- Subject utama: [deskripsi 1 kalimat]
- Background: [deskripsi]
- Foreground elements: [props/icons]

**Color Palette**
- Primary: [#hex] [warna]
- Accent: [#hex] [warna]
- Text bg: [#hex]
- Text fg: [#hex]

**Layout Grid**
- Posisi text: [left/right/center]
- Posisi subject: [opposite text]
- Penekanan visual: [face/object/number]

**Emotion Score**
- Curiosity: 1-10
- Trust: 1-10
- Urgency: 1-10

**Reasoning**: [kenapa konsep ini cocok untuk audience]
\`\`\`

Bahasa: Indonesia. Copy thumbnail boleh 1-2 kata English jika cocok (e.g. "VIRAL", "STOP").`,
      buildUserPrompt: (input) =>
        `Judul: ${input.title}\nAudiens: ${input.audience}\nVibe: ${input.vibe}`,
      outputType: "markdown",
    },
  },
  {
    slug: "thumbnail-maker",
    emoji: "🎨",
    label: "THUMBNAIL MAKER",
    category: "thumbnail",
    description: "Versi cepat: copy thumbnail + 2 variasi tone (urgency vs benefit).",
    fields: [
      {
        name: "title",
        label: "Judul Video",
        kind: "text",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.85,
      maxTokens: 1500,
      systemPrompt: `Generate 6 copy thumbnail (max 4 kata setiap copy) untuk satu judul video.

Output markdown:

## Variasi Urgency (kuat, alarm)
1. [COPY 4 KATA]
2. [COPY 4 KATA]
3. [COPY 4 KATA]

## Variasi Benefit (manfaat, positif)
1. [COPY 4 KATA]
2. [COPY 4 KATA]
3. [COPY 4 KATA]

## Saran Visual
1 paragraf saran subject + warna dominan.`,
      buildUserPrompt: (input) => `Judul: ${input.title}`,
      outputType: "markdown",
    },
  },
  {
    slug: "thumbnail-master-ai",
    emoji: "🎯",
    label: "THUMBNAIL MASTER AI",
    category: "thumbnail",
    description: "Analisa thumbnail competitor + saran differentiation.",
    fields: [
      {
        name: "topic",
        label: "Topik / Keyword Video",
        kind: "text",
        required: true,
      },
      {
        name: "competitors",
        label: "Deskripsi Thumbnail Competitor (2-3)",
        kind: "textarea",
        rows: 5,
        placeholder: "Contoh:\n1. Wajah ustadz close-up + text 'JANGAN LAKUKAN INI' merah\n2. Tangan menunjuk + 'RAHASIA' kuning",
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.7,
      maxTokens: 2500,
      systemPrompt: `Anda adalah thumbnail competitive analyst. Tugas: analisa pola thumbnail kompetitor, identifikasi kesamaan, lalu sarankan thumbnail yang STAND OUT.

Output:
## Competitor Analysis
- Pattern dominan: [warna, expression, copy style]
- Saturasi pasar: low/medium/high

## Differentiation Strategy
3 angle berbeda dari pattern dominan, masing-masing dengan:
- Copy thumbnail
- Color palette berbeda dari competitor
- Visual gimmick (e.g. negative space, unusual crop, kontradiksi)
- Why this stands out: [reasoning]

## Final Recommendation
Pilih 1 dari 3 yang paling viable + pricing/effort estimate.`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topic}\nCompetitor thumbnail:\n${input.competitors || "(tidak ada)"}`,
      outputType: "markdown",
    },
  },
  {
    slug: "thumbnail-master-ai-pro",
    emoji: "🎯",
    label: "THUMBNAIL MASTER AI PRO",
    category: "thumbnail",
    description: "Pro version: A/B test 6 thumbnail dengan prediksi CTR per opsi.",
    fields: [
      {
        name: "title",
        label: "Judul Video",
        kind: "text",
        required: true,
      },
      {
        name: "audience",
        label: "Target Audiens",
        kind: "text",
        default: "muslim Indonesia 18-35",
      },
      {
        name: "channel",
        label: "Karakter Channel (opsional)",
        kind: "text",
        placeholder: "Contoh: dakwah pemuda, edukatif tapi santai",
      },
    ],
    config: {
      kind: "llm",
      model: "anthropic/claude-opus-4.7",
      temperature: 0.75,
      maxTokens: 4000,
      systemPrompt: `Anda adalah senior thumbnail strategist dengan track record CTR tinggi.

Untuk satu judul, hasilkan **6 thumbnail concept** untuk A/B test.

Untuk setiap konsep:
\`\`\`
## Concept N — [Nama]

**Hook Type**: [curiosity / urgency / benefit / contrarian / list / before-after]
**Copy** (max 4 kata): [COPY]
**Subject Composition**: [deskripsi]
**Color Palette**: 2-3 warna dominan + hex
**Lighting/Mood**: [soft / dramatic / vibrant]

**Predicted CTR** (estimasi 1-10): X
**Risk**: [low / medium / high]
**Why this works**: [psikologi 2 kalimat]
**Why this might fail**: [risk factor]
\`\`\`

Setelah 6 konsep, beri:
## Summary Matrix
Table: Concept | Hook | CTR Pred | Risk | Best For

## Recommended Test Pairs
3 pasang konsep yang paling kontras untuk dijadikan A/B test variant.`,
      buildUserPrompt: (input) =>
        `Judul: ${input.title}\nAudiens: ${input.audience}\nChannel: ${input.channel || "(generic)"}`,
      outputType: "markdown",
    },
  },
];
