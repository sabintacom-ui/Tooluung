# PRD — YouTube Content Automation Platform
## Dokumen 02: Fitur Lengkap & User Stories

---

## 1. Struktur Fitur (Feature Tree)

```
YouTube Content Automation Platform
├── F1. Manajemen Konten
│   ├── F1.1 Content Calendar
│   ├── F1.2 Input Topik & Brief
│   └── F1.3 Template Konten
├── F2. Pipeline Generasi Konten
│   ├── F2.1 Generate Script (Grok)
│   ├── F2.2 Generate Voiceover (ElevenLabs)
│   ├── F2.3 Generate Background Music (Suno)
│   ├── F2.4 Generate Thumbnail (Ideogram/DALL-E)
│   ├── F2.5 Ambil Stock Footage (Pexels API)
│   └── F2.6 Render Video Final (FFmpeg/Remotion)
├── F3. Review & Approval
│   ├── F3.1 Preview Video
│   ├── F3.2 Edit Script & Metadata
│   └── F3.3 Approval Workflow
├── F4. Publikasi YouTube
│   ├── F4.1 Upload Video
│   ├── F4.2 Penjadwalan Publish
│   └── F4.3 Manajemen Playlist
├── F5. Monitoring & Analitik
│   ├── F5.1 Status Pipeline Realtime
│   ├── F5.2 Performa Video
│   └── F5.3 Cost Tracker
├── F6. Konfigurasi
│   ├── F6.1 API Provider Settings
│   ├── F6.2 Brand/Channel Profile
│   └── F6.3 Notifikasi
└── F7. Integrasi Google Workspace
    ├── F7.1 Google Sheets Sync
    └── F7.2 Google Apps Script Scheduler
```

---

## 2. Detail Fitur & User Stories

---

### F1. Manajemen Konten

#### F1.1 Content Calendar

**Deskripsi:** Tampilan kalender untuk merencanakan, melihat, dan mengelola jadwal konten.

**User Stories:**

| ID | Story | Prioritas |
|---|---|---|
| US-101 | Sebagai creator, saya ingin melihat semua video yang dijadwalkan dalam tampilan kalender bulanan agar saya bisa merencanakan konten dengan mudah | P0 |
| US-102 | Sebagai creator, saya ingin drag-and-drop video ke tanggal lain untuk mengubah jadwal | P1 |
| US-103 | Sebagai creator, saya ingin melihat status setiap video (draft/generating/review/scheduled/published) langsung dari kalender | P0 |
| US-104 | Sebagai agensi, saya ingin memfilter kalender per klien/channel | P1 |

**Acceptance Criteria US-101:**
- Tampilan default adalah bulan berjalan
- Setiap slot video menampilkan judul, status, dan waktu publish
- Klik slot membuka detail video
- Navigasi antar bulan tersedia

---

#### F1.2 Input Topik & Brief

**Deskripsi:** Form untuk memasukkan topik/brief yang akan dijadikan video.

**User Stories:**

| ID | Story | Prioritas |
|---|---|---|
| US-111 | Sebagai creator, saya ingin memasukkan topik video beserta tone dan target audiens agar AI menghasilkan konten yang sesuai | P0 |
| US-112 | Sebagai creator, saya ingin bisa input beberapa topik sekaligus (batch input) | P1 |
| US-113 | Sebagai creator, saya ingin import topik dari Google Sheets | P1 |
| US-114 | Sebagai creator, saya ingin AI menyarankan topik berdasarkan tren saat ini | P2 |

**Field Input:**
```
- Topik utama (wajib)
- Target audiens
- Tone & gaya (formal / santai / inspiratif / edukatif)
- Durasi target video (1–3 mnt / 5–10 mnt / 10–20 mnt)
- Keyword SEO tambahan
- Catatan khusus untuk AI
- Template yang digunakan
- Tanggal & waktu publish target
```

---

#### F1.3 Template Konten

**Deskripsi:** Template mendefinisikan "kepribadian" konten channel sehingga setiap video memiliki gaya konsisten.

**User Stories:**

| ID | Story | Prioritas |
|---|---|---|
| US-121 | Sebagai creator, saya ingin membuat template yang menyimpan gaya penulisan, karakter suara, dan layout thumbnail | P0 |
| US-122 | Sebagai creator, saya ingin mengclone template dan memodifikasinya | P1 |
| US-123 | Sebagai agensi, saya ingin satu template terikat ke satu channel klien | P0 |

**Komponen Template:**
```
Script:
  - System prompt untuk AI (gaya penulisan, struktur)
  - Opening hook template
  - CTA (call-to-action) standar
  - Durasi target

Voice (ElevenLabs):
  - Voice ID
  - Stability & similarity boost
  - Kecepatan bicara

Music (Suno):
  - Genre / mood
  - Intensitas (low/medium/high)
  - Durasi fade in/out

Thumbnail:
  - Style prompt
  - Warna dominan
  - Font (dari preset)
  - Layout (teks kiri/kanan/tengah)

Video:
  - Resolusi output (1080p/4K)
  - Aspect ratio (16:9 / 9:16 Shorts)
  - Transisi antar klip
```

---

### F2. Pipeline Generasi Konten

#### F2.1 Generate Script (Grok)

**Deskripsi:** Menggunakan Grok API untuk menghasilkan script lengkap video.

**User Stories:**

| ID | Story | Prioritas |
|---|---|---|
| US-211 | Sebagai sistem, saya harus generate script yang mencakup hook, isi, dan CTA sesuai template | P0 |
| US-212 | Sebagai creator, saya ingin melihat script sebelum diproses ke tahap berikutnya | P0 |
| US-213 | Sebagai creator, saya ingin mengedit script hasil AI sebelum dikonversi ke voice | P0 |
| US-214 | Sebagai sistem, saya harus generate judul (5 opsi), deskripsi, dan tags secara bersamaan | P0 |

**Output Script:**
```json
{
  "title_options": ["...", "...", "...", "...", "..."],
  "selected_title": "...",
  "description": "...",
  "tags": ["tag1", "tag2", "..."],
  "chapters": [
    { "time": "0:00", "title": "Intro" },
    { "time": "0:45", "title": "..." }
  ],
  "script_segments": [
    {
      "segment": "intro",
      "text": "...",
      "duration_estimate": 30
    }
  ],
  "thumbnail_prompt": "..."
}
```

---

#### F2.2 Generate Voiceover (ElevenLabs)

| ID | Story | Prioritas |
|---|---|---|
| US-221 | Sebagai sistem, saya harus mengkonversi script ke audio MP3 menggunakan voice yang dipilih di template | P0 |
| US-222 | Sebagai creator, saya ingin preview audio sebelum proses lanjut | P0 |
| US-223 | Sebagai sistem, saya harus menyimpan timestamp tiap segmen untuk sinkronisasi video | P0 |

---

#### F2.3 Generate Background Music (Suno)

| ID | Story | Prioritas |
|---|---|---|
| US-231 | Sebagai sistem, saya harus generate musik latar sesuai mood yang didefinisikan di template | P0 |
| US-232 | Sebagai creator, saya ingin memilih dari beberapa opsi musik yang digenerate | P1 |
| US-233 | Sebagai sistem, volume musik harus otomatis lebih rendah saat ada narasi (ducking) | P0 |

---

#### F2.4 Generate Thumbnail (Ideogram / DALL-E)

| ID | Story | Prioritas |
|---|---|---|
| US-241 | Sebagai sistem, saya harus generate thumbnail 1280x720px dari prompt yang dibuat AI berdasarkan judul video | P0 |
| US-242 | Sebagai creator, saya ingin memilih dari 3 opsi thumbnail yang digenerate | P1 |
| US-243 | Sebagai creator, saya ingin menambahkan teks overlay pada thumbnail | P1 |

---

#### F2.5 Ambil Stock Footage (Pexels API)

| ID | Story | Prioritas |
|---|---|---|
| US-251 | Sebagai sistem, saya harus mencari dan mengambil video stock yang relevan dengan konten berdasarkan keyword dari script | P0 |
| US-252 | Sebagai sistem, saya hanya boleh mengambil footage dengan lisensi bebas komersial | P0 |

---

#### F2.6 Render Video Final (FFmpeg / Remotion)

| ID | Story | Prioritas |
|---|---|---|
| US-261 | Sebagai sistem, saya harus merakut semua aset (footage, voiceover, musik, subtitle) menjadi satu file video | P0 |
| US-262 | Sebagai sistem, saya harus generate subtitle otomatis dari script dan sinkronkan ke video | P1 |
| US-263 | Sebagai creator, saya ingin menerima notifikasi saat render selesai | P0 |

---

### F3. Review & Approval

#### F3.1 Preview Video

| ID | Story | Prioritas |
|---|---|---|
| US-311 | Sebagai creator, saya ingin memutar preview video sebelum publish | P0 |
| US-312 | Sebagai creator, saya ingin melihat script, judul, deskripsi, tags, dan thumbnail di satu halaman review | P0 |
| US-313 | Sebagai agensi, saya ingin berbagi link preview ke klien tanpa akses ke dashboard | P1 |

---

#### F3.2 Edit Script & Metadata

| ID | Story | Prioritas |
|---|---|---|
| US-321 | Sebagai creator, saya ingin mengedit judul, deskripsi, dan tags sebelum upload | P0 |
| US-322 | Sebagai creator, saya ingin regenerate bagian tertentu saja (misal: hanya thumbnail) tanpa ulang semua | P1 |
| US-323 | Sebagai creator, saya ingin mengganti pilihan judul dari 5 opsi yang digenerate AI | P0 |

---

#### F3.3 Approval Workflow

| ID | Story | Prioritas |
|---|---|---|
| US-331 | Sebagai creator, saya bisa approve/reject video dengan satu klik | P0 |
| US-332 | Sebagai agensi, saya bisa assign video ke anggota tim untuk review | P1 |
| US-333 | Sebagai brand manager, saya ingin approval dua tahap: tim internal lalu klien | P2 |

---

### F4. Publikasi YouTube

| ID | Story | Prioritas |
|---|---|---|
| US-411 | Sebagai creator, saya ingin video terupload otomatis ke YouTube sesuai jadwal | P0 |
| US-412 | Sebagai creator, saya ingin memilih: publish langsung / jadwal / simpan sebagai draft di YouTube | P0 |
| US-413 | Sebagai creator, saya ingin video otomatis dimasukkan ke playlist yang sesuai | P1 |
| US-414 | Sebagai creator, saya ingin menerima notifikasi saat video berhasil/gagal diupload | P0 |

---

### F5. Monitoring & Analitik

| ID | Story | Prioritas |
|---|---|---|
| US-511 | Sebagai creator, saya ingin melihat status tiap tahap pipeline secara realtime | P0 |
| US-512 | Sebagai creator, saya ingin melihat performa video (views, watch time, CTR) di dashboard | P1 |
| US-513 | Sebagai creator, saya ingin melihat total biaya API yang digunakan per video dan per bulan | P1 |
| US-514 | Sebagai agensi, saya ingin laporan performa mingguan otomatis dikirim ke email | P2 |

---

## 3. Matriks Prioritas Fitur

| Prioritas | Definisi | Fitur |
|---|---|---|
| **P0** | Wajib ada di v1.0 | Input topik, generate script, voiceover, thumbnail, upload YouTube, review |
| **P1** | Target v1.1 | Batch input, template, Suno music, stock footage, render video, jadwal |
| **P2** | Roadmap v2.0 | Multi-channel, approval workflow tim, AI topic suggestion, laporan otomatis |
