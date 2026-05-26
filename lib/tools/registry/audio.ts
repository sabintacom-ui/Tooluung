import "server-only";
import type { Tool } from "../types";

const SONNET = "anthropic/claude-sonnet-4.6";

export const AUDIO_TOOLS: Tool[] = [
  {
    slug: "suaraku",
    emoji: "🎙️",
    label: "SUARAKU",
    category: "audio",
    description: "Skrip narator pribadi: tone, jeda, intonasi, untuk direkam suara sendiri.",
    fields: [
      {
        name: "topic",
        label: "Topik / Pesan Utama",
        kind: "textarea",
        rows: 4,
        required: true,
      },
      {
        name: "duration",
        label: "Durasi",
        kind: "select",
        default: "60s",
        options: [
          { value: "30s", label: "30 detik" },
          { value: "60s", label: "60 detik" },
          { value: "120s", label: "2 menit" },
          { value: "300s", label: "5 menit" },
        ],
      },
      {
        name: "voice",
        label: "Karakter Suara",
        kind: "select",
        default: "santai",
        options: [
          { value: "santai", label: "Santai akrab" },
          { value: "ceramah", label: "Ceramah hangat" },
          { value: "narator", label: "Narator dokumenter" },
          { value: "energetik", label: "Energetik anak muda" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.75,
      maxTokens: 2200,
      systemPrompt: `Tulis skrip narator dengan ANNOTASI lengkap untuk perekaman:

Format setiap kalimat:
[tempo: slow|normal|fast] [emotion: warm|excited|serious] [pause: 0.5s/1s/2s]
"Kalimat untuk dibaca."

Aturan:
- Tempo dan emotion harus variatif (jangan monoton)
- Pause strategis di akhir punchline atau sebelum reveal
- Hindari kalimat panjang >18 kata (susah napas)
- Akhiri dengan call-to-action 1 kalimat

Setelah skrip, beri:
## Tips Recording
- Ambient suggestion (silence/pad/musik latar)
- BPM bicara
- Common pitfalls untuk topik ini`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topic}\nDurasi: ${input.duration}\nKarakter: ${input.voice}`,
      outputType: "markdown",
    },
  },
  {
    slug: "voicer-ai",
    emoji: "🎤",
    label: "VOICER AI",
    category: "audio",
    description: "TTS langsung pakai ElevenLabs — masukkan teks, dapat MP3 siap unduh.",
    fields: [
      {
        name: "text",
        label: "Teks untuk Disuarakan",
        kind: "textarea",
        rows: 8,
        placeholder: "Maksimal 2500 karakter",
        required: true,
      },
      {
        name: "voice",
        label: "Pilih Suara",
        kind: "select",
        default: "rachel",
        options: [
          { value: "rachel", label: "Sarah (perempuan, mature)" },
          { value: "domi", label: "Laura (perempuan, ceria)" },
          { value: "bella", label: "Matilda (perempuan, intelektual)" },
          { value: "antoni", label: "Roger (laki, santai)" },
          { value: "josh", label: "Daniel (laki, broadcaster)" },
          { value: "adam", label: "Charlie (laki, deep)" },
          { value: "sam", label: "George (laki, warm)" },
        ],
      },
      {
        name: "stability",
        label: "Stability",
        kind: "select",
        default: "0.5",
        options: [
          { value: "0.3", label: "0.3 — variatif emotional" },
          { value: "0.5", label: "0.5 — balanced" },
          { value: "0.75", label: "0.75 — stabil profesional" },
        ],
      },
    ],
    config: {
      kind: "tts",
    },
  },
  {
    slug: "kampung-youtuber-voice",
    emoji: "🎙️",
    label: "KAMPUNG YOUTUBER VOICE",
    category: "audio",
    description: "Skrip voice-over gaya YouTuber Indonesia (santai, banyak interjeksi).",
    fields: [
      {
        name: "topic",
        label: "Topik",
        kind: "textarea",
        rows: 4,
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 2000,
      systemPrompt: `Tulis skrip voice-over gaya YouTuber Indonesia (e.g. Atta, Deddy, Ferry Irwandi, Reza Auditore — pilih spektrum sesuai topik). Ciri:
- Banyak interjeksi natural ("oke", "jadi", "lho", "guys")
- Pertanyaan retorik untuk engage viewer
- Beat humor ringan (jangan dipaksa)
- Tempo variatif (cepat saat penjelasan, slow saat reveal)

Output skrip + annotation [pause]/[fast]/[emphasis] strategis.`,
      buildUserPrompt: (input) => `Topik: ${input.topic}`,
      outputType: "markdown",
    },
  },
  {
    slug: "text-to-suara",
    emoji: "🔊",
    label: "TEXT TO SUARA",
    category: "audio",
    description: "TTS quick — teks pendek (<500 char), suara default, output MP3.",
    fields: [
      {
        name: "text",
        label: "Teks",
        kind: "textarea",
        rows: 5,
        placeholder: "Max 500 karakter",
        required: true,
      },
    ],
    config: {
      kind: "tts",
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    },
  },
];
