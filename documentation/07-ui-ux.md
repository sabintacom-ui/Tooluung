# PRD — YouTube Content Automation Platform
## Dokumen 07: UI/UX Requirements

---

## 1. Prinsip Desain

| Prinsip | Penerapan |
|---|---|
| **Clarity first** | Status pipeline selalu terlihat jelas, tidak perlu tebak-tebak |
| **Progressive disclosure** | Tampilkan detail teknis hanya jika diperlukan (collapse/expand) |
| **One primary action** | Setiap halaman punya satu tombol utama yang jelas |
| **Minimal friction** | Dari input topik ke approval: maksimal 3 klik |
| **Feedback cepat** | Loading state, progress bar, dan notifikasi di setiap aksi |

---

## 2. Struktur Navigasi

```
Sidebar Navigation:
├── Dashboard (ringkasan & statistik)
├── Konten
│   ├── Kalender
│   ├── Semua Konten
│   └── Buat Baru (+)
├── Template
├── Analitik
└── Pengaturan
    ├── Channel & YouTube
    ├── API Keys
    └── Notifikasi
```

---

## 3. Halaman per Halaman

---

### 3.1 Dashboard

**Tujuan:** Ringkasan status terkini channel dan pipeline.

**Komponen:**
- **Stats row (4 kartu):**
  - Total video bulan ini
  - Video berhasil dipublish
  - Video menunggu review
  - Total biaya API bulan ini (USD)

- **Pipeline aktif:**
  - List video yang sedang diproses, lengkap dengan progress bar per step
  - Real-time update via Supabase Realtime

- **Jadwal minggu ini:**
  - Mini kalender 7 hari ke depan
  - Slot video berwarna per status

- **Quick action:**
  - Tombol "Buat Konten Baru" di pojok kanan atas (selalu terlihat)

---

### 3.2 Form Buat Konten Baru

**Tujuan:** Input topik dan konfigurasi video baru.

**Layout:** Dua kolom — Form kiri, Preview estimasi kanan.

**Bagian Form:**

```
Topik & Brief
  ├── [Input] Topik utama *
  ├── [Input] Target audiens
  ├── [Textarea] Keywords SEO (comma-separated)
  └── [Textarea] Catatan khusus untuk AI

Konfigurasi
  ├── [Select] Template *
  ├── [Select] Durasi target (1–3 mnt / 5–10 mnt / 10–20 mnt)
  └── [Checkbox] Mode otomatis (skip review, langsung upload)

Jadwal
  ├── [DateTimePicker] Tanggal & jam publish
  └── [Toggle] Publish sekarang (disable DateTimePicker)

[Tombol] Estimasi Biaya (sebelum generate)
[Tombol Utama] Generate Konten →
```

**Estimasi biaya** muncul sebagai badge kecil sebelum user klik generate, misal: `~$0.42 / sekitar Rp 6.500`.

---

### 3.3 Status Pipeline (Realtime)

**Tujuan:** Tampilkan progress pipeline yang sedang berjalan.

**Tampilan:**

```
┌─ Video: "5 Tips Produktivitas untuk Freelancer" ────────┐
│                                                          │
│  ✅ 1. Generate script & metadata     (0:32)            │
│  ✅ 2. Generate voiceover             (1:15)            │
│  🔄 3. Generate musik latar           running...        │
│  🔄 4. Generate thumbnail             running...        │
│  🔄 5. Cari stock footage             running...        │
│  ⬜ 6. Render video                   waiting           │
│  ⬜ 7. Upload ke YouTube              waiting           │
│                                                          │
│  [████████████░░░░░░░░░░] 45% — estimasi 8 menit lagi  │
│                                                          │
│                                     [Batalkan Pipeline] │
└──────────────────────────────────────────────────────────┘
```

---

### 3.4 Halaman Review

**Tujuan:** Review semua output sebelum publish.

**Layout:** Tab-based

```
Tab: [Script] [Audio] [Thumbnail] [Video Preview] [Metadata]
```

**Tab Script:**
- Tampilkan script lengkap yang bisa diedit inline
- Highlight segmen yang akan dibacakan
- Tombol "Regenerate Script" jika tidak puas

**Tab Audio:**
- Audio player dengan waveform
- Tampilkan transcript dengan timestamp
- Tombol "Regenerate Voice"

**Tab Thumbnail:**
- Tampilkan 3 opsi thumbnail berdampingan
- Klik untuk pilih/deselect
- Tombol "Regenerate Thumbnail"
- Opsi tambah teks overlay sederhana

**Tab Video Preview:**
- Player video lengkap dengan subtitle
- Tampilkan estimasi durasi dan ukuran file

**Tab Metadata:**
- Field edit: Judul (dropdown 5 opsi + custom)
- Edit deskripsi
- Edit tags (chip input)
- Preview tampilan di YouTube search result

**Action bar (selalu terlihat di bawah):**
```
[Reject & Revisi]  [← Kembali]  [Approve & Jadwalkan →]
```

---

### 3.5 Content Calendar

**Tujuan:** Visualisasi jadwal konten dalam tampilan kalender.

**Fitur:**
- Toggle: tampilan Bulan / Minggu
- Warna slot per status:
  - 🔵 Biru = sedang generate
  - 🟡 Kuning = menunggu review
  - 🟢 Hijau = terjadwal
  - ⚫ Abu = published
  - 🔴 Merah = gagal
- Klik slot → buka side panel detail video
- Drag & drop untuk ubah jadwal
- Tombol "+" di tiap tanggal untuk buat konten baru di tanggal itu

---

### 3.6 Halaman Template

**Tujuan:** Buat dan kelola template konten.

**List template:** Card grid dengan preview warna dan nama.

**Form Edit Template:** Dibagi menjadi section yang bisa di-collapse:
```
Umum
  ├── Nama template
  └── Deskripsi singkat

Konfigurasi Script (Grok)
  ├── System prompt (textarea besar)
  ├── Tone & gaya
  └── Template CTA

Suara (ElevenLabs)
  ├── Pilih voice (dropdown dengan preview play)
  ├── Slider stability & similarity
  └── Kecepatan bicara

Musik (Suno/Mubert)
  ├── Genre
  ├── Mood
  └── Intensitas

Thumbnail (Ideogram)
  ├── Style prompt
  ├── Color picker (warna primer & aksen)
  └── Layout

Video
  ├── Resolusi
  ├── Aspect ratio
  └── Transisi
```

---

### 3.7 Pengaturan — API Keys

**Tujuan:** Kelola API keys semua provider.

**Tampilan:**

```
Provider      | Status      | Key             | Aksi
─────────────────────────────────────────────────────────
Grok (xAI)   | ✅ Aktif    | xai-●●●●●●abcd | Edit | Test
ElevenLabs   | ✅ Aktif    | sk-●●●●●●efgh  | Edit | Test
Suno         | ⚠️ Belum set | —              | Tambah
Ideogram     | ✅ Aktif    | id-●●●●●●ijkl  | Edit | Test
Pexels       | ✅ Aktif    | ●●●●●●mnop    | Edit | Test
YouTube      | ✅ Connected| (OAuth)         | Reconnect
```

- Tombol "Test" verifikasi key dengan simple API call
- Key tersimpan encrypted di database
- Tidak pernah ditampilkan full setelah disimpan

---

## 4. Responsive Design

| Breakpoint | Behavior |
|---|---|
| Desktop (≥1280px) | Layout penuh dengan sidebar tetap terlihat |
| Tablet (768–1279px) | Sidebar collapse menjadi icon, konten melebar |
| Mobile (<768px) | Sidebar jadi bottom navigation, kalender mode minggu |

---

## 5. Notifikasi & Alert

**In-app notifications:**
- Pipeline selesai → "Video [judul] siap direview"
- Upload berhasil → "Video [judul] telah dipublish"
- Pipeline gagal → "Pipeline [judul] gagal di step [X]. Klik untuk lihat detail"

**Email notifications (opsional, bisa dimatikan):**
- Ringkasan mingguan (video yang dipublish, performa, biaya)
- Alert jika biaya harian melebihi threshold

---

## 6. Empty States

Setiap halaman harus punya tampilan yang ramah ketika data kosong:

| Halaman | Empty State |
|---|---|
| Dashboard | "Belum ada konten. Mulai dengan membuat video pertama →" |
| Calendar | "Belum ada jadwal. Klik + untuk tambah konten" |
| Template | "Buat template pertama untuk mulai otomasi" |
| Analytics | "Data analitik tersedia setelah video pertama dipublish" |
