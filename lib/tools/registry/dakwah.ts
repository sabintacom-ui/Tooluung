import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";
const OPUS = "anthropic/claude-opus-4.7";

export const DAKWAH_TOOLS: Tool[] = [
  {
    slug: "tafsir-singkat",
    emoji: "📖",
    label: "TAFSIR SINGKAT",
    category: "dakwah",
    description: "Tafsir singkat ayat Al-Quran dari berbagai mufassir untuk konten dakwah.",
    fields: [
      {
        name: "ayat",
        label: "Surah & Ayat",
        kind: "text",
        placeholder: "Contoh: Al-Baqarah 286, An-Nisa 36, atau ayat tematik",
        required: true,
      },
      {
        name: "format",
        label: "Format Output",
        kind: "select",
        default: "shorts",
        options: [
          { value: "shorts", label: "Format Shorts (60 detik)" },
          { value: "longform", label: "Format Long-form (8 menit)" },
          { value: "carousel", label: "Carousel Instagram (5 slide)" },
          { value: "thread", label: "Thread Twitter/X" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.6,
      maxTokens: 3500,
      systemPrompt: `Anda adalah penulis konten tafsir Al-Quran untuk audiens Indonesia awam (bukan akademisi). Tugas: jelaskan ayat dengan akurat, mudah dipahami, dan APPLICABLE ke kehidupan modern.

Output sesuai format yang diminta:

**Shorts/60s:**
- Hook 5 detik
- Baca ayat (Arab + transliterasi + terjemahan)
- Konteks turun (1 kalimat)
- Inti pesan (3 poin singkat)
- Aplikasi praktis (1 kalimat closing)

**Long-form/8min:**
- Outline 5 segment dengan timestamp
- Skrip lengkap per segment

**Carousel 5 slide:**
- Slide 1: Hook + Ayat
- Slide 2-3: Tafsir
- Slide 4: Aplikasi
- Slide 5: CTA save/share

**Thread:**
- 7-10 tweet (max 280 char each)
- Numbered, hook di tweet 1, payoff di tweet terakhir

Sumber rujukan (sebut implisit, jangan dikutip kecuali penting): Tafsir Ibnu Katsir, Quraish Shihab, Al-Misbah, Tafsir Kemenag.

PENTING: Hindari klaim hukum spesifik (haram/halal absolut) tanpa konteks. Jika ada perbedaan pendapat ulama, sebutkan.`,
      buildUserPrompt: (input) =>
        `Ayat: ${input.ayat}\nFormat: ${input.format}\n\nGenerate konten tafsir.`,
      outputType: "markdown",
    },
  },
  {
    slug: "hadits-search",
    emoji: "📜",
    label: "HADITS SEARCH",
    category: "dakwah",
    description: "Cari hadits berdasarkan tema + tampilkan dengan derajat shahih/hasan/dhaif.",
    fields: [
      {
        name: "tema",
        label: "Tema Hadits",
        kind: "text",
        placeholder: "Contoh: keutamaan shalat berjamaah, sabar, sedekah",
        required: true,
      },
      {
        name: "jumlah",
        label: "Jumlah Hadits",
        kind: "select",
        default: "5",
        options: [
          { value: "3", label: "3 hadits" },
          { value: "5", label: "5 hadits" },
          { value: "10", label: "10 hadits" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.4,
      maxTokens: 4000,
      systemPrompt: `Anda adalah peneliti hadits untuk konten dakwah. Cari hadits-hadits yang relevan dengan tema, prioritas dari Bukhari, Muslim, Tirmidzi, Abu Dawud, Nasai, Ibnu Majah.

Untuk setiap hadits:

\`\`\`
## Hadits N — Tema [singkat]

**Arab:**
[teks Arab dengan harakat]

**Transliterasi:**
[transliterasi Indonesia]

**Terjemahan:**
[terjemahan Indonesia]

**Sumber:**
HR. [Imam] no. [nomor] dalam Kitab [...]

**Derajat:**
Shahih / Hasan / Dhaif (sertakan komentator: e.g. "Shahih menurut Al-Albani")

**Penjelasan Singkat:**
[1-2 kalimat konteks dan pelajaran]
\`\`\`

PENTING:
- Akurasi teks dan sanad WAJIB. Jika ragu, sebut "verifikasi dengan kitab asli".
- Hindari hadits palsu/maudhu' bahkan kalau populer.
- Sebutkan derajat (jangan asumsi shahih jika dhaif).`,
      buildUserPrompt: (input) => `Tema: ${input.tema}\nJumlah: ${input.jumlah} hadits`,
      outputType: "markdown",
    },
  },
  {
    slug: "doa-harian",
    emoji: "🤲",
    label: "DOA HARIAN",
    category: "dakwah",
    description: "Kompilasi doa harian dengan Arab, latin, terjemahan, dan keutamaannya.",
    fields: [
      {
        name: "kategori",
        label: "Kategori Doa",
        kind: "select",
        default: "harian",
        options: [
          { value: "harian", label: "Doa Harian (pagi/sore)" },
          { value: "shalat", label: "Doa Sebelum/Sesudah Shalat" },
          { value: "rezeki", label: "Doa Rezeki & Kemudahan" },
          { value: "anak", label: "Doa untuk Anak & Keluarga" },
          { value: "musibah", label: "Doa Saat Musibah" },
          { value: "khusus", label: "Doa Khusus (custom topik)" },
        ],
      },
      {
        name: "topik_khusus",
        label: "Topik Khusus (jika dipilih)",
        kind: "text",
        placeholder: "Contoh: doa minta jodoh, doa hutang lunas, doa hadapi ujian",
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.5,
      maxTokens: 3500,
      systemPrompt: `Anda kompilator doa-doa shahih dari Quran dan Sunnah. Tugas: kumpulkan 5-7 doa relevan kategori user, sertakan untuk setiap:

\`\`\`
## Doa N: [Nama Singkat]

**Arab:**
[teks Arab dengan harakat]

**Transliterasi:**
[transliterasi Indonesia jelas, hyphenated]

**Terjemahan:**
[terjemahan Indonesia]

**Sumber:**
[QS. .../HR. ...]

**Keutamaan / Waktu Pembacaan:**
[1-2 kalimat konteks]
\`\`\`

Prioritaskan doa dari Al-Quran dan hadits shahih (Bukhari, Muslim). Hindari doa yang sumbernya lemah.`,
      buildUserPrompt: (input) =>
        `Kategori: ${input.kategori}${input.topik_khusus ? `\nTopik khusus: ${input.topik_khusus}` : ""}`,
      outputType: "markdown",
    },
  },
  {
    slug: "khutbah-generator",
    emoji: "🕌",
    label: "KHUTBAH GENERATOR",
    category: "dakwah",
    description: "Naskah khutbah Jumat lengkap (rukun + isi + doa penutup).",
    fields: [
      {
        name: "tema",
        label: "Tema Khutbah",
        kind: "textarea",
        rows: 3,
        placeholder: "Contoh: Pentingnya silaturahmi di era digital",
        required: true,
      },
      {
        name: "audiens",
        label: "Karakter Jamaah",
        kind: "select",
        default: "umum",
        options: [
          { value: "umum", label: "Jamaah Umum" },
          { value: "remaja", label: "Remaja & Pemuda" },
          { value: "kantor", label: "Karyawan/Profesional" },
          { value: "kampus", label: "Mahasiswa" },
        ],
      },
      {
        name: "durasi",
        label: "Durasi Khutbah",
        kind: "select",
        default: "10min",
        options: [
          { value: "5min", label: "5 menit (singkat)" },
          { value: "10min", label: "10 menit (standar)" },
          { value: "15min", label: "15 menit (panjang)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.65,
      maxTokens: 5000,
      systemPrompt: `Anda penulis khutbah Jumat untuk khatib Indonesia. Tulis khutbah LENGKAP yang memenuhi rukun-rukun:

# KHUTBAH PERTAMA

## Pembuka (Mukadimah)
- Hamdalah lengkap
- 2 kalimat syahadat
- Shalawat
- Wasiat takwa (kepada diri & jamaah)

## Isi Khutbah Pertama
- Pengantar tema (mengapa relevan sekarang)
- Dalil dari Al-Quran (1-2 ayat dengan terjemahan)
- Penjelasan praktis
- Contoh kontekstual modern

## Penutup Khutbah Pertama
- Hadits pendukung
- Resapan + ajakan

# KHUTBAH KEDUA

## Pembuka
- Hamdalah singkat
- Shalawat

## Isi Khutbah Kedua
- Penegasan tema (1-2 paragraf)
- Doa untuk umat & negara

## Doa Penutup
- Doa kebaikan dunia akhirat
- Salam penutup

Bahasa: Indonesia formal-santun. Kutipan Arab dengan harakat + transliterasi + terjemahan. Sesuaikan panjang dengan durasi yang diminta.`,
      buildUserPrompt: (input) =>
        `Tema: ${input.tema}\nAudiens: ${input.audiens}\nDurasi: ${input.durasi}\n\nTulis naskah khutbah Jumat lengkap.`,
      outputType: "markdown",
    },
  },
  {
    slug: "tausyiah-generator",
    emoji: "🌙",
    label: "TAUSYIAH GENERATOR",
    category: "dakwah",
    description: "Tausyiah singkat 1-3 menit untuk Reels/Shorts/podcast harian.",
    fields: [
      {
        name: "tema",
        label: "Tema Tausyiah",
        kind: "textarea",
        rows: 2,
        required: true,
      },
      {
        name: "durasi",
        label: "Durasi",
        kind: "select",
        default: "60s",
        options: [
          { value: "30s", label: "30 detik" },
          { value: "60s", label: "60 detik" },
          { value: "90s", label: "90 detik" },
          { value: "180s", label: "3 menit" },
        ],
      },
      {
        name: "tone",
        label: "Tone",
        kind: "select",
        default: "santai",
        options: [
          { value: "santai", label: "Santai-akrab" },
          { value: "formal", label: "Formal-tegas" },
          { value: "puitis", label: "Puitis-reflektif" },
          { value: "humor", label: "Humor ringan" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.8,
      maxTokens: 2200,
      systemPrompt: `Tulis tausyiah singkat untuk konten harian. Struktur:

1. **Hook 5 detik**: Pertanyaan retorik atau pernyataan kontra-intuitif
2. **Develop**: Cerita/analogi/dalil singkat
3. **Twist**: Sudut pandang baru atau tafsir mendalam
4. **Closing**: 1 kalimat resonant + ajakan

Aturan:
- Bahasa Indonesia santai (jangan formal kaku)
- Hindari kata berat (transendental, esensial)
- Pakai imagery konkret (kopi, motor, kerjaan, dll)
- Akhiri dengan kalimat yang nyangkut, bukan klise

Output:
- Skrip dengan annotation [pause]/[emphasis]
- Caption Reels/TikTok 1 paragraf
- 5 hashtag relevan`,
      buildUserPrompt: (input) =>
        `Tema: ${input.tema}\nDurasi: ${input.durasi}\nTone: ${input.tone}`,
      outputType: "markdown",
    },
  },
  {
    slug: "cerita-anak-islami",
    emoji: "🧒",
    label: "CERITA ANAK ISLAMI",
    category: "dakwah",
    description: "Cerita Islami untuk anak (usia 5-12) dengan pesan moral terselubung.",
    fields: [
      {
        name: "tema",
        label: "Tema / Pesan Moral",
        kind: "text",
        placeholder: "Contoh: jujur itu menyelamatkan, sabar saat antri, sayang adik",
        required: true,
      },
      {
        name: "usia",
        label: "Target Usia",
        kind: "select",
        default: "7-9",
        options: [
          { value: "5-7", label: "5-7 tahun" },
          { value: "7-9", label: "7-9 tahun" },
          { value: "9-12", label: "9-12 tahun" },
        ],
      },
      {
        name: "format",
        label: "Format",
        kind: "select",
        default: "podcast",
        options: [
          { value: "podcast", label: "Podcast Audio (3-5 menit)" },
          { value: "buku", label: "Buku Cerita Bergambar" },
          { value: "video", label: "Skrip Video Animasi" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.85,
      maxTokens: 3500,
      systemPrompt: `Anda penulis cerita anak Islami profesional. Tulis cerita yang:

- Tokoh: anak Indonesia (sebut nama Indonesia, e.g. Rafa, Aisha, Yusuf)
- Setting: relate (sekolah, rumah, masjid, taman)
- Plot: ada konflik kecil yang anak bisa relate
- Resolusi: lewat tindakan baik/dialog dengan ortu/teman
- Pesan moral: TERSIRAT (jangan dikotbahkan), tunjukkan lewat akibat tindakan

Hindari:
- Karakter villain stereotypical (nakal sekali, jahat)
- Akhir yang menyelematkan dengan deus ex machina
- Bahasa terlalu kompleks
- Quote ayat/hadits panjang (max 1, dengan terjemahan)

Format sesuai pilihan:
- **Podcast**: skrip narator dengan dialog karakter + sound effect cues
- **Buku**: 8-12 halaman dengan deskripsi visual per halaman
- **Video**: scene 1-5 dengan visual cue dan voice-over`,
      buildUserPrompt: (input) =>
        `Tema/Pesan: ${input.tema}\nUsia: ${input.usia} tahun\nFormat: ${input.format}`,
      outputType: "markdown",
    },
  },
  {
    slug: "quote-islami",
    emoji: "💬",
    label: "QUOTE ISLAMI",
    category: "dakwah",
    description: "20 quote Islami catchy + atribusi (Quran/Hadits/Ulama) untuk feed sosmed.",
    fields: [
      {
        name: "tema",
        label: "Tema",
        kind: "text",
        placeholder: "Contoh: motivasi, sabar, syukur, ikhtiar, tawakkal",
        required: true,
      },
      {
        name: "tipe",
        label: "Tipe Quote",
        kind: "select",
        default: "campuran",
        options: [
          { value: "campuran", label: "Campuran (Quran+Hadits+Ulama)" },
          { value: "quran", label: "Hanya Al-Quran" },
          { value: "hadits", label: "Hanya Hadits" },
          { value: "ulama", label: "Hanya Ulama (Imam Syafi'i, Hasan Basri, dll)" },
          { value: "modern", label: "Tokoh Modern (Buya Hamka, Quraish Shihab, dll)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.75,
      maxTokens: 3000,
      systemPrompt: `Generate 20 quote Islami pendek (max 25 kata each) yang AKURAT dan IMPACTFUL untuk feed sosmed.

Format setiap quote:

\`\`\`
## Quote N
"[isi quote ringkas, terjemahan jika dari Arab]"
— [Atribusi: QS .../ HR .../ Nama Ulama]

[Caption singkat 1 kalimat untuk konteks]
\`\`\`

Aturan:
- Akurat: jangan karang quote palsu
- Pilih yang QUOTABLE (gampang share)
- Variasi tema (jangan semua tentang sabar)
- Mix antara terkenal dan kurang dikenal
- Untuk Quran: cukup terjemahannya, bukan teks Arab
- Akhiri dengan section "## Caption Sosmed Suggestion" (3 alternatif intro caption)`,
      buildUserPrompt: (input) => `Tema: ${input.tema}\nTipe: ${input.tipe}`,
      outputType: "markdown",
    },
  },
  {
    slug: "doa-acara",
    emoji: "🎤",
    label: "DOA PENUTUP ACARA",
    category: "dakwah",
    description: "Naskah doa pembuka/penutup untuk berbagai acara (formal/non-formal).",
    fields: [
      {
        name: "acara",
        label: "Jenis Acara",
        kind: "text",
        placeholder: "Contoh: rapat kantor, wisuda, pengajian RT, pernikahan",
        required: true,
      },
      {
        name: "moment",
        label: "Saat",
        kind: "select",
        default: "penutup",
        options: [
          { value: "pembuka", label: "Pembuka Acara" },
          { value: "penutup", label: "Penutup Acara" },
          { value: "syukuran", label: "Syukuran/Tasyakuran" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: HAIKU,
      temperature: 0.6,
      maxTokens: 1500,
      systemPrompt: `Tulis naskah doa untuk acara dengan format:

1. **Pembuka**: Ta'awudz, Basmalah, Hamdalah, Shalawat
2. **Doa Inti**:
   - Permohonan ampunan
   - Permohonan terkait acara (sesuaikan jenis)
   - Permohonan keberkahan untuk hadirin
   - Doa kebaikan dunia akhirat
3. **Penutup**: Robbana atina + Sayyidina Muhammad + salam

Bahasa: campuran Arab (dengan latin) + Indonesia. Format clean untuk pembaca/MC.

Sertakan:
- Versi Arab (untuk dibaca pemimpin doa)
- Versi terjemahan (untuk subtitle/handout)
- Estimasi durasi pembacaan`,
      buildUserPrompt: (input) => `Acara: ${input.acara}\nSaat: ${input.moment}`,
      outputType: "markdown",
    },
  },
];
