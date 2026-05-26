import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";

export const VISUAL_TOOLS: Tool[] = [
  {
    slug: "scrip-to-prompt",
    emoji: "🖼️",
    label: "SCRIP TO PROMPT",
    category: "visual",
    description: "Konversi paragraf skrip jadi list prompt visual untuk AI image generator.",
    badge: "NEW",
    fields: [
      {
        name: "script",
        label: "Skrip / Narasi",
        kind: "textarea",
        rows: 8,
        placeholder: "Tempel skrip yang ingin di-visualkan",
        required: true,
      },
      {
        name: "style",
        label: "Style Visual",
        kind: "select",
        default: "cinematic",
        options: [
          { value: "cinematic", label: "Cinematic Realistic" },
          { value: "anime", label: "Anime / Studio Ghibli" },
          { value: "watercolor", label: "Watercolor Painting" },
          { value: "minimal", label: "Minimal Flat Design" },
          { value: "vintage", label: "Vintage Photography" },
          { value: "fantasy", label: "Fantasy Illustration" },
        ],
      },
      {
        name: "aspect",
        label: "Aspect Ratio",
        kind: "select",
        default: "16:9",
        options: [
          { value: "16:9", label: "16:9 Landscape" },
          { value: "9:16", label: "9:16 Vertical (Shorts)" },
          { value: "1:1", label: "1:1 Square" },
          { value: "4:3", label: "4:3 Classic" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.75,
      maxTokens: 3500,
      systemPrompt: `Anda adalah visual director yang memecah skrip jadi sequence shot list.
Untuk skrip yang diberikan, identifikasi 8-15 visual shot lalu untuk setiap shot tulis:

\`\`\`
Shot N — [00:XX-00:YY]
Subject: [main subject deskripsi 1-2 kalimat]
Action: [aksi/pose]
Environment: [setting]
Mood: [atmosfer + lighting]
Camera: [angle + lens hint, e.g. low-angle wide 24mm]

Prompt (Midjourney/DALL-E):
[prompt 1 baris siap copy-paste, 30-60 kata, English, --ar X:Y --v 6]
\`\`\`

Style hint: terapkan style yang user pilih ke setiap prompt.
Bahasa shot list: Indonesia. Bahasa prompt: English.`,
      buildUserPrompt: (input) =>
        `Skrip:\n${input.script}\n\nStyle: ${input.style}\nAspect: ${input.aspect}\n\nGenerate shot list lengkap.`,
      outputType: "markdown",
    },
  },
  {
    slug: "prompt-vision",
    emoji: "🖼️",
    label: "PROMPT VISION",
    category: "visual",
    description: "Generate prompt AI image dari deskripsi singkat — output 5 variasi style berbeda.",
    badge: "NEW",
    fields: [
      {
        name: "subject",
        label: "Subject / Objek Utama",
        kind: "textarea",
        rows: 3,
        placeholder: "Contoh: pemuda muslim sedang dzikir di masjid saat shubuh",
        required: true,
      },
      {
        name: "mood",
        label: "Mood / Suasana",
        kind: "text",
        placeholder: "khusyuk, tenang, hangat",
        default: "khusyuk dan tenang",
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 2500,
      systemPrompt: `Anda adalah prompt engineer untuk AI image generators.
Untuk subject + mood yang diberikan, hasilkan 5 prompt VARIATIF dengan style berbeda:

1. **Cinematic Realistic** (Midjourney v6 style)
2. **Anime / Studio Ghibli**
3. **Watercolor Painting**
4. **Minimal Flat Illustration**
5. **Vintage Film Photography**

Untuk setiap prompt:
- Title style
- Prompt English siap copy-paste (40-80 kata, detail subject + lighting + camera + style + quality boosters)
- Negative prompt (untuk Stable Diffusion users)
- Aspect ratio rekomendasi

Hindari konten yang menggambarkan wajah figur agama spesifik (Nabi/Sahabat) atau yang sensitif.`,
      buildUserPrompt: (input) =>
        `Subject: ${input.subject}\nMood: ${input.mood}\n\nGenerate 5 prompt variasi.`,
      outputType: "markdown",
    },
  },
  {
    slug: "gambarku",
    emoji: "🎨",
    label: "GAMBARKU",
    category: "visual",
    description: "Generate prompt visual karakter konsisten untuk series/storytelling.",
    badge: "NEW",
    fields: [
      {
        name: "character",
        label: "Deskripsi Karakter",
        kind: "textarea",
        rows: 4,
        placeholder: "Contoh: pemuda 22 tahun, Indonesia, koko putih, peci hitam, kacamata bulat, senyum lembut",
        required: true,
      },
      {
        name: "scenes",
        label: "Daftar Scene",
        kind: "textarea",
        rows: 4,
        placeholder: "1. Sedang baca quran\n2. Sedang ngajar anak-anak\n3. Naik motor menuju masjid",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.7,
      maxTokens: 3500,
      systemPrompt: `Anda adalah character designer untuk visual storytelling.
Buat character sheet detail (untuk konsistensi cross-image), lalu generate prompt per scene yang refer ke character sheet itu.

Output format:

## Character Sheet
[deskripsi fix 60-100 kata: face, hair, build, signature clothing, distinguishing features]

## Master Prompt Anchor
[1 baris prompt anchor English yang harus muncul di setiap scene prompt]

## Scene Prompts
Untuk setiap scene:
\`\`\`
Scene N — [judul scene]
Setting: [env]
Action: [aksi]

Prompt:
[character anchor + scene specific + camera + lighting + style]
\`\`\`

Pertahankan konsistensi: warna pakaian, fitur wajah, postur tetap sama di semua scene.`,
      buildUserPrompt: (input) =>
        `Karakter: ${input.character}\n\nDaftar Scene:\n${input.scenes}\n\nGenerate character sheet + scene prompts.`,
      outputType: "markdown",
    },
  },
  {
    slug: "scrip-to-image",
    emoji: "🎨",
    label: "SCRIP TO IMAGE",
    category: "visual",
    description: "Versi cepat: skrip → 1 prompt image hero per paragraf.",
    fields: [
      {
        name: "script",
        label: "Skrip",
        kind: "textarea",
        rows: 8,
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.7,
      maxTokens: 2500,
      systemPrompt: `Untuk setiap paragraf di skrip, generate 1 prompt hero image English (50-80 kata) yang bisa langsung di-copy ke Midjourney/DALL-E. Format: numbered list dengan paragraf snippet (10 kata pertama) lalu prompt-nya.`,
      buildUserPrompt: (input) => `Skrip:\n${input.script}`,
      outputType: "markdown",
    },
  },
  {
    slug: "visual-to-prompt",
    emoji: "🖼️",
    label: "VISUAL TO PROMPT",
    category: "visual",
    description: "Reverse engineering: deskripsi gambar → prompt yang bisa reproduksi visual itu.",
    fields: [
      {
        name: "description",
        label: "Deskripsi Detail Gambar",
        kind: "textarea",
        rows: 6,
        placeholder: "Deskripsikan gambar referensi sedetail mungkin",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.6,
      maxTokens: 2000,
      systemPrompt: `Anda adalah reverse prompt engineer. Dari deskripsi gambar, deduce prompt yang reproducible.

Output:
1. **Subject Block** — apa yang di gambar
2. **Style Block** — art style + influences
3. **Composition Block** — framing, angle, focal point
4. **Lighting Block** — light source + mood
5. **Camera Block** — lens + depth of field
6. **Final Prompt** — 1 baris siap copy-paste English untuk Midjourney v6 + parameter

Sertakan negative prompt untuk Stable Diffusion.`,
      buildUserPrompt: (input) => `Deskripsi: ${input.description}\n\nReverse-engineer prompt-nya.`,
      outputType: "markdown",
    },
  },
  {
    slug: "prompt-video",
    emoji: "🎬",
    label: "PROMPT VIDEO",
    category: "visual",
    description: "Generate prompt video untuk Sora/Veo/Runway dari deskripsi singkat scene.",
    fields: [
      {
        name: "scene",
        label: "Deskripsi Scene",
        kind: "textarea",
        rows: 4,
        required: true,
      },
      {
        name: "duration",
        label: "Durasi",
        kind: "select",
        default: "5s",
        options: [
          { value: "5s", label: "5 detik" },
          { value: "10s", label: "10 detik" },
          { value: "15s", label: "15 detik" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: `Anda adalah video prompt engineer untuk Sora/Veo/Runway.

Output format:
## Sora / Veo Prompt
[prompt 80-120 kata English: subject + action + camera movement + lighting + style + duration hint]

## Runway Gen-3 Prompt
[lebih ringkas 30-50 kata + parameter --motion]

## Storyboard (optional)
3 keyframe: opening shot → climax shot → closing shot

## Camera Movements
List 2-3 movement saran (e.g. dolly in, orbit, handheld follow)`,
      buildUserPrompt: (input) => `Scene: ${input.scene}\nDurasi: ${input.duration}\n\nGenerate prompt video.`,
      outputType: "markdown",
    },
  },
];
