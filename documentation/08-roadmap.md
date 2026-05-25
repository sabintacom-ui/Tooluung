# PRD — YouTube Content Automation Platform
## Dokumen 08: Roadmap & Timeline Pengembangan

---

## 1. Filosofi Pengembangan

> Build small, ship fast, iterate often.

Setiap fase menghasilkan produk yang bisa digunakan secara mandiri. Tidak perlu menunggu semua fitur selesai untuk mulai digunakan.

---

## 2. Ringkasan Fase

| Fase | Nama | Durasi | Target |
|---|---|---|---|
| **Fase 0** | Setup & Foundation | 3–5 hari | Project bisa berjalan lokal |
| **Fase 1** | MVP Core | 2–3 minggu | End-to-end pipeline 1 video |
| **Fase 2** | Production Ready | 3–4 minggu | Stabil, bisa digunakan harian |
| **Fase 3** | Scale & Polish | 4–6 minggu | Multi-template, analitik, agensi |
| **Fase 4** | Advanced | Ongoing | Multi-channel, AI avatar, marketplace |

---

## 3. Detail Per Fase

---

### Fase 0 — Setup & Foundation (3–5 hari)

**Tujuan:** Project siap untuk dikembangkan.

**Deliverables:**
- [ ] Inisiasi project Next.js 14 dengan App Router
- [ ] Setup Supabase (database + auth)
- [ ] Konfigurasi NextAuth.js + Google OAuth
- [ ] Deploy ke Vercel (preview URL)
- [ ] Setup Drizzle ORM + migrasi schema dasar
- [ ] Struktur folder project sesuai dokumen arsitektur
- [ ] File `.env.example` lengkap
- [ ] README setup guide

**Done when:** Aplikasi bisa diakses di Vercel, login dengan Google berfungsi.

---

### Fase 1 — MVP Core (2–3 minggu)

**Tujuan:** Satu topik bisa menghasilkan satu video yang bisa direview dan diupload.

**Minggu 1 — Pipeline Dasar:**
- [ ] Halaman "Buat Konten Baru" dengan form input
- [ ] Integrasi Grok API — generate script & metadata
- [ ] Simpan output ke database
- [ ] Halaman review script & metadata (tanpa video preview)
- [ ] Status tracker sederhana (text-based, bukan realtime)

**Minggu 2 — Audio & Upload:**
- [ ] Integrasi ElevenLabs API — generate voiceover
- [ ] Simpan audio ke Vercel Blob
- [ ] Audio player di halaman review
- [ ] Integrasi Ideogram API — generate thumbnail (1 opsi)
- [ ] Integrasi YouTube Data API — upload video (video dummy dulu)
- [ ] Notifikasi in-app sederhana

**Minggu 3 — Polish MVP:**
- [ ] Error handling & retry logic di pipeline
- [ ] Halaman daftar konten dengan status
- [ ] Kalender sederhana (tampilan list, bukan visual kalender)
- [ ] Pengaturan API keys

**Done when:** Input topik → approve → video terupload ke YouTube berhasil (meski video masih sederhana/text-based).

---

### Fase 2 — Production Ready (3–4 minggu)

**Tujuan:** Pipeline stabil, video berkualitas layak publish, UX nyaman digunakan harian.

**Minggu 4 — Video Assembly:**
- [ ] Integrasi Pexels API — fetch stock footage
- [ ] Integrasi FFmpeg — render video final dengan footage + voiceover
- [ ] Generate & overlay subtitle otomatis
- [ ] Thumbnail 3 opsi, bisa dipilih
- [ ] Video preview di halaman review

**Minggu 5 — Music & Template:**
- [ ] Integrasi Mubert API — background music
- [ ] Audio ducking (musik lebih pelan saat narasi)
- [ ] Sistem template konten (CRUD)
- [ ] Assign template ke video baru

**Minggu 6 — Reliability:**
- [ ] Realtime status pipeline (Supabase Realtime)
- [ ] Retry logic yang robust per step
- [ ] Pipeline logs untuk debugging
- [ ] Alert jika pipeline gagal
- [ ] Cost tracking per video

**Minggu 7 — Calendar & Polish:**
- [ ] Visual content calendar (tampilan bulan)
- [ ] Penjadwalan publish YouTube
- [ ] Regenerate per komponen (hanya thumbnail / hanya script)
- [ ] Mobile responsive dasar

**Done when:** 10 video berhasil diproduksi dan dipublish dalam seminggu tanpa error kritis.

---

### Fase 3 — Scale & Polish (4–6 minggu)

**Tujuan:** Siap digunakan untuk agensi, performa lebih baik.

**Fitur:**
- [ ] Google Apps Script scheduler + Google Sheets sync
- [ ] Batch input topik (import CSV / Sheets)
- [ ] Analytics dashboard (YouTube Analytics API)
- [ ] Laporan performa otomatis (email mingguan)
- [ ] Multi-template per channel
- [ ] Drag-and-drop kalender
- [ ] Approval workflow (assign reviewer)
- [ ] Link preview untuk share ke klien
- [ ] Export laporan ke PDF
- [ ] Vercel Cron untuk backup scheduler

**Done when:** Sinta (persona agensi) bisa menggunakan platform untuk mengelola konten 3 klien berbeda sekaligus.

---

### Fase 4 — Advanced (Ongoing)

**Fitur roadmap jangka panjang:**

| Fitur | Estimasi | Prioritas |
|---|---|---|
| Multi-channel dari satu akun | 2 minggu | Tinggi |
| Suno API (saat tersedia) | 1 minggu | Tinggi |
| AI topic suggestion (trending) | 1 minggu | Sedang |
| Heygen / D-ID — AI avatar presenter | 3 minggu | Sedang |
| YouTube Shorts pipeline terpisah | 2 minggu | Tinggi |
| Multi-platform (TikTok, Instagram Reels) | 4 minggu | Sedang |
| Marketplace template komunitas | 6 minggu | Rendah |
| White-label untuk agensi | 4 minggu | Rendah |

---

## 4. Milestone & Go/No-Go Criteria

| Milestone | Criteria Go |
|---|---|
| **M1: MVP Launch** | 1 video berhasil diproduksi end-to-end |
| **M2: Production Launch** | 10 video/minggu tanpa error kritis, waktu produksi < 15 menit |
| **M3: Agency Ready** | Bisa kelola 3+ channel, laporan otomatis berjalan |
| **M4: Scale** | 50+ video/bulan, uptime > 99%, biaya/video < $0.50 |

---

## 5. Tech Debt yang Direncanakan

Beberapa keputusan disengaja untuk kecepatan di fase awal yang perlu diperbaiki nanti:

| Item | Fase saat ini | Rencana perbaikan |
|---|---|---|
| FFmpeg di Vercel Function | Fase 1–2 | Ganti Shotstack API / dedicated render server di Fase 3 |
| Polling status (tiap 5 detik) | Fase 1 | Ganti Supabase Realtime di Fase 2 |
| File temp di Vercel Blob | Fase 1–2 | Cleanup job otomatis di Fase 2 |
| Single user per akun | Fase 1–2 | Multi-user / tim di Fase 3 |
| API keys tersimpan terenkripsi tapi di DB | Fase 1–3 | Migrasi ke Vercel Environment Secrets atau Vault di Fase 4 |
