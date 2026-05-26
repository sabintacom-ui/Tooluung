import "server-only";
import type { Tool } from "../types";

const HAIKU = "anthropic/claude-haiku-4.5";
const SONNET = "anthropic/claude-sonnet-4.6";
const OPUS = "anthropic/claude-opus-4.7";

export const ISLAMIC_TOOLS: Tool[] = [
  {
    slug: "kalkulator-zakat",
    emoji: "💰",
    label: "KALKULATOR ZAKAT",
    category: "konten",
    description: "Hitung zakat (mal/profesi/perdagangan/emas) + penjelasan fiqih.",
    fields: [
      {
        name: "jenis",
        label: "Jenis Zakat",
        kind: "select",
        default: "mal",
        options: [
          { value: "mal", label: "Zakat Mal (harta umum)" },
          { value: "profesi", label: "Zakat Profesi/Penghasilan" },
          { value: "perdagangan", label: "Zakat Perdagangan" },
          { value: "emas", label: "Zakat Emas/Perak" },
          { value: "pertanian", label: "Zakat Pertanian" },
          { value: "fitrah", label: "Zakat Fitrah" },
        ],
      },
      {
        name: "data",
        label: "Detail Harta/Penghasilan",
        kind: "textarea",
        rows: 4,
        placeholder: "Contoh: Tabungan 50jt, emas 30g, gaji 8jt/bulan",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.3,
      maxTokens: 2500,
      systemPrompt: `Anda konsultan zakat profesional. Berdasarkan data user, hitung zakat dengan akurasi fiqih.

Output:
## Perhitungan Zakat
- Jenis zakat: [jenis]
- Nishab (batas wajib): [angka]
- Total harta yang dizakatkan: [perhitungan]
- Tarif zakat: [persentase, biasanya 2.5%]
- Total zakat: [hasil]

## Detail Perhitungan
Step-by-step breakdown.

## Dalil Pendukung
Ayat/hadits yang jadi dasar perhitungan.

## Penyaluran
- Mustahik (8 golongan)
- Lembaga rekomendasi (BAZNAS, Dompet Dhuafa, dll)
- Doa saat menyalurkan zakat (Arab + terjemahan)

## Catatan Penting
- Apa yang BUKAN dihitung (utang, kebutuhan dasar)
- Haul (kepemilikan 1 tahun)
- Disclaimer: "Untuk kasus kompleks, konsultasi dengan ulama terpercaya"`,
      buildUserPrompt: (input) => `Jenis: ${input.jenis}\n\nData: ${input.data}`,
      outputType: "markdown",
    },
  },
  {
    slug: "kalkulator-waris",
    emoji: "📜",
    label: "KALKULATOR WARIS",
    category: "konten",
    description: "Pembagian waris Islam (fara'idh) dengan pembagian sesuai ahli waris.",
    fields: [
      {
        name: "harta",
        label: "Total Harta Warisan",
        kind: "text",
        placeholder: "Contoh: Rp 500.000.000",
        required: true,
      },
      {
        name: "ahli_waris",
        label: "Daftar Ahli Waris",
        kind: "textarea",
        rows: 5,
        placeholder: "Contoh:\n- Istri 1\n- Anak laki-laki 2\n- Anak perempuan 3\n- Ibu kandung\n- Ayah meninggal",
        required: true,
      },
      {
        name: "wasiat",
        label: "Wasiat (jika ada, max 1/3)",
        kind: "text",
        placeholder: "Kosongkan jika tidak ada wasiat",
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.2,
      maxTokens: 4000,
      systemPrompt: `Anda ahli ilmu fara'idh (waris Islam). Hitung pembagian waris dengan akurasi tinggi.

Langkah:
1. Identifikasi ahli waris yang berhak (dzawil furudh + ashabah)
2. Tentukan furudh (bagian pasti) per ahli waris
3. Hitung sisa untuk ashabah
4. Selesaikan jika ada radd (sisa tanpa ashabah) atau aul (kekurangan)

Output:
## Status Ahli Waris
Per ahli waris yang disebutkan: berhak waris atau terhalang (mahjub).

## Perhitungan Furudh
| Ahli Waris | Bagian | Persentase | Rupiah |
|------------|--------|------------|--------|

## Penjelasan Per Bagian
Untuk setiap ahli waris: dasar dalil + alasan bagian.

## Wasiat (jika ada)
Validasi: max 1/3 + bukan untuk ahli waris (tanpa persetujuan).

## Catatan
- Hutang almarhum harus dilunasi DULU
- Biaya pengurusan jenazah
- Disclaimer: "Konsultasi notaris syariah / KUA / ulama untuk eksekusi formal"

PENTING: Akurasi adalah prioritas. Jangan asal hitung.`,
      buildUserPrompt: (input) =>
        `Total harta: ${input.harta}\n\nAhli waris:\n${input.ahli_waris}\n\nWasiat: ${input.wasiat || "(tidak ada)"}`,
      outputType: "markdown",
    },
  },
  {
    slug: "jadwal-puasa",
    emoji: "🌙",
    label: "JADWAL PUASA SUNNAH",
    category: "konten",
    description: "Kalender puasa sunnah (Senin Kamis/Ayyamul Bidh/Asyura/Arafah/dll).",
    fields: [
      {
        name: "bulan",
        label: "Bulan",
        kind: "select",
        default: "current",
        options: [
          { value: "current", label: "Bulan Saat Ini" },
          { value: "ramadhan", label: "Persiapan Ramadhan" },
          { value: "muharram", label: "Muharram (Asyura)" },
          { value: "syaban", label: "Sya'ban" },
          { value: "dzulhijjah", label: "Dzulhijjah (Arafah)" },
          { value: "rajab", label: "Rajab" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.4,
      maxTokens: 2500,
      systemPrompt: `Generate kalender puasa sunnah lengkap untuk bulan/periode yang dipilih:

## Daftar Puasa Sunnah Bulan Ini
Per puasa:
- Nama puasa (e.g. Senin-Kamis, Ayyamul Bidh)
- Tanggal Hijriyah + perkiraan Masehi
- Niat puasa (Arab + terjemahan)
- Keutamaan (1 paragraf + dalil hadits)
- Adab pelaksanaan

## Tips Praktis
- Persiapan sahur menu sehat
- Hidrasi
- Kegiatan ibadah saat puasa
- Berbuka yang sunnah

## Doa Berbuka
Arab + terjemahan + waktu yang tepat

## Reminder Schedule
Saran setting reminder di HP/kalender.`,
      buildUserPrompt: (input) => `Bulan: ${input.bulan}`,
      outputType: "markdown",
    },
  },
  {
    slug: "konsultasi-ibadah",
    emoji: "❓",
    label: "KONSULTASI IBADAH",
    category: "konten",
    description: "Tanya jawab fiqih ibadah (shalat/puasa/zakat/haji) dengan dalil.",
    fields: [
      {
        name: "pertanyaan",
        label: "Pertanyaan Anda",
        kind: "textarea",
        rows: 5,
        placeholder: "Contoh: Apa hukum mengqadha shalat yang sengaja ditinggalkan?",
        required: true,
      },
    ],
    config: {
      kind: "llm",
      model: OPUS,
      temperature: 0.5,
      maxTokens: 3500,
      systemPrompt: `Anda konsultan fiqih ibadah. Jawab pertanyaan user dengan struktur:

## Jawaban Singkat
1-2 kalimat jawaban langsung (jangan bertele-tele).

## Pendapat 4 Madzhab
Untuk pertanyaan fiqih kontroversial, sebut perbedaan pendapat:
- Hanafi
- Maliki
- Syafi'i
- Hanbali

## Dalil
- Ayat Al-Quran (jika relevan)
- Hadits dengan derajat
- Ijma' / qiyas (jika ada)

## Penjelasan Detail
3-5 paragraf elaborasi.

## Aplikasi Praktis
Cara menerapkan di kehidupan sehari-hari.

## Disclaimer
"Untuk kasus spesifik dan kompleks, konsultasi langsung dengan ustadz/kyai terpercaya."

PENTING:
- Prioritaskan jawaban yang ITTIFAQ (disepakati)
- Jangan dogmatic — sebut perbedaan jika ada
- Hindari fatwa kontroversial atau yang menyesatkan`,
      buildUserPrompt: (input) => `Pertanyaan: ${input.pertanyaan}`,
      outputType: "markdown",
    },
  },
  {
    slug: "doa-pernikahan",
    emoji: "💍",
    label: "DOA PERNIKAHAN",
    category: "konten",
    description: "Naskah doa walimatul ursy (pernikahan) lengkap.",
    fields: [
      {
        name: "moment",
        label: "Saat",
        kind: "select",
        default: "akad",
        options: [
          { value: "akad", label: "Akad Nikah" },
          { value: "walimah", label: "Walimah / Resepsi" },
          { value: "khotbah", label: "Khotbah Nikah" },
        ],
      },
      {
        name: "pengantin",
        label: "Nama Pengantin (opsional)",
        kind: "text",
        placeholder: "Contoh: Ahmad & Fatimah",
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.6,
      maxTokens: 2800,
      systemPrompt: `Tulis naskah lengkap untuk pernikahan Islam:

## Khotbah Nikah (jika moment khotbah)
- Pembuka (hamdalah, syahadat, shalawat)
- Tema khotbah (3 ayat utama: Adz-Dzariyat 49, Ar-Rum 21, An-Nisa 1)
- Wasiat takwa untuk kedua pengantin
- Wasiat hubungan suami-istri (mawaddah, rahmah, sakinah)
- Doa penutup khotbah

## Doa Akad
- Doa setelah ijab qabul (Bahasa Arab + terjemahan)
- Doa untuk pengantin baru

## Doa Walimah
- Doa sebelum makan (untuk tamu)
- Doa keberkahan rumah tangga
- Doa keturunan shaleh
- Doa rezeki halal

## Susunan Acara Saran
Outline acara yang Islamic-friendly.

Format clean untuk MC/penghulu/khatib.`,
      buildUserPrompt: (input) =>
        `Moment: ${input.moment}\nPengantin: ${input.pengantin || "(generic)"}`,
      outputType: "markdown",
    },
  },
  {
    slug: "parenting-islam",
    emoji: "👨‍👩‍👧",
    label: "PARENTING ISLAM",
    category: "konten",
    description: "Tips parenting Islami untuk berbagai usia anak (0-18).",
    fields: [
      {
        name: "topik",
        label: "Topik / Pertanyaan Parenting",
        kind: "textarea",
        rows: 4,
        placeholder: "Contoh: Bagaimana mengajarkan shalat ke anak 5 tahun?",
        required: true,
      },
      {
        name: "usia",
        label: "Usia Anak",
        kind: "select",
        default: "5-7",
        options: [
          { value: "0-2", label: "Bayi (0-2 tahun)" },
          { value: "3-5", label: "Balita (3-5 tahun)" },
          { value: "5-7", label: "Anak (5-7 tahun)" },
          { value: "8-12", label: "Anak (8-12 tahun)" },
          { value: "13-15", label: "Remaja awal (13-15)" },
          { value: "16-18", label: "Remaja akhir (16-18)" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.7,
      maxTokens: 3000,
      systemPrompt: `Anda konsultan parenting Islami. Jawab dengan pendekatan yang:
- Berdasar Quran/Sunnah + psikologi anak modern
- Praktis (bukan teoretis)
- Menghindari approach harsh/punitive
- Menghindari "cuekin saja, nanti juga nurut"

Output:
## Pendekatan Islami (Quran/Sunnah)
- Dalil utama relevan
- Contoh dari Rasulullah/Sahabat dalam mendidik anak

## Strategi Praktis (5-7 tips)
Aksi konkret yang bisa orang tua lakukan minggu ini.

## Skrip Percakapan
1-2 contoh dialog ortu-anak dalam situasi terkait.

## Yang HARUS Dihindari
3 common mistakes yang sering ortu lakukan.

## Resources
- 2 buku parenting Islami yang relevan
- 1 hadits yang bisa dipasang di kamar anak`,
      buildUserPrompt: (input) =>
        `Topik: ${input.topik}\nUsia anak: ${input.usia}`,
      outputType: "markdown",
    },
  },
  {
    slug: "ruqyah-syariah",
    emoji: "🕯️",
    label: "RUQYAH SYAR'IYAH",
    category: "konten",
    description: "Bacaan ruqyah syar'iyah dari Quran/Sunnah untuk perlindungan diri.",
    fields: [
      {
        name: "tujuan",
        label: "Tujuan Ruqyah",
        kind: "select",
        default: "umum",
        options: [
          { value: "umum", label: "Perlindungan Umum (harian)" },
          { value: "rumah", label: "Perlindungan Rumah" },
          { value: "anak", label: "Perlindungan Anak" },
          { value: "sakit", label: "Saat Sakit" },
          { value: "gangguan", label: "Gangguan Jin/Sihir" },
          { value: "tidur", label: "Sebelum Tidur" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.4,
      maxTokens: 3500,
      systemPrompt: `Generate ruqyah syar'iyah yang hanya pakai sumber autentik (Quran + hadits shahih).

Output:
## Bacaan Ruqyah
Per bacaan:
- Nama (e.g. Al-Fatihah, Ayat Kursi, 3 Qul)
- Teks Arab dengan harakat
- Transliterasi
- Terjemahan
- Sumber: QS / HR

## Cara Pelaksanaan
Step-by-step untuk niat, posisi, jumlah pengulangan, doa pembuka & penutup.

## Adab Ruqyah
- Niat ikhlas hanya berlindung kepada Allah
- Tidak menggantungkan kesembuhan ke jimat/dukun
- Tetap berikhtiar medis jika sakit

## Yang DILARANG dalam Ruqyah
3-5 hal yang membatalkan keabsahan ruqyah (mantra non-Arab, tawasul ke jin, dll).

## Disclaimer
"Untuk gangguan parah, datangi peruqyah terpercaya yang berpegang pada manhaj Salaf."

PENTING: Hanya pakai bacaan yang ada dalil shahihnya. Jangan invent.`,
      buildUserPrompt: (input) => `Tujuan: ${input.tujuan}`,
      outputType: "markdown",
    },
  },
  {
    slug: "wirid-dzikir",
    emoji: "📿",
    label: "WIRID & DZIKIR",
    category: "konten",
    description: "Kompilasi wirid pagi-petang + dzikir bakda shalat (autentik dari Sunnah).",
    fields: [
      {
        name: "waktu",
        label: "Waktu",
        kind: "select",
        default: "pagi",
        options: [
          { value: "pagi", label: "Wirid Pagi (al-ma'tsurat)" },
          { value: "petang", label: "Wirid Petang" },
          { value: "shalat", label: "Dzikir Bakda Shalat" },
          { value: "tidur", label: "Dzikir Sebelum Tidur" },
          { value: "bangun", label: "Dzikir Bangun Tidur" },
        ],
      },
    ],
    config: {
      kind: "llm",
      model: SONNET,
      temperature: 0.4,
      maxTokens: 4000,
      systemPrompt: `Generate kompilasi wirid/dzikir lengkap dari sumber autentik.

Per dzikir:
- Nama / pembuka
- Teks Arab dengan harakat
- Transliterasi Indonesia
- Terjemahan
- Jumlah bacaan
- Sumber: HR. [Imam] no. [nomor]
- Keutamaan (1 paragraf)

Urutan logis: dari pembuka → ayat → kalimat thoyyibah → istighfar → shalawat → doa penutup.

## Estimasi Durasi
Total waktu untuk membaca lengkap.

## Adab Berdzikir
- Khusyuk
- Konsisten
- Tidak terburu-buru
- Niat ikhlas

PENTING: Hanya pakai dzikir dari hadits shahih. Tag derajat shahih/hasan jika ada keraguan.`,
      buildUserPrompt: (input) => `Waktu: ${input.waktu}`,
      outputType: "markdown",
    },
  },
];
