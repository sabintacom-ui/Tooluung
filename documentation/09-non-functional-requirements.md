# PRD — YouTube Content Automation Platform
## Dokumen 09: Non-Functional Requirements

---

## 1. Performa

### Response Time

| Operasi | Target | Maksimum |
|---|---|---|
| Load halaman dashboard | < 1.5 detik | 3 detik |
| Submit form buat konten | < 500ms (return job ID) | 1 detik |
| Update status realtime | < 2 detik delay | 5 detik |
| Load content calendar | < 2 detik | 4 detik |
| Pipeline end-to-end (full auto) | < 15 menit | 30 menit |

### Throughput

| Skenario | Target |
|---|---|
| Concurrent pipeline jobs | 3 job paralel (configurable) |
| Video per hari (satu channel) | Up to 6 (batas YouTube API default) |
| Video per hari (dengan kuota tambahan) | Up to 50 |

---

## 2. Ketersediaan (Availability)

| Komponen | Target Uptime |
|---|---|
| Vercel (frontend + API) | 99.9% (SLA Vercel Pro) |
| Supabase | 99.9% (SLA Supabase Pro) |
| Pipeline keseluruhan | 95% (bergantung pada provider eksternal) |

### Degradasi Graceful

Jika satu provider AI tidak tersedia:
- Grok down → fallback ke Claude / GPT-4o (konfigurasi di settings)
- ElevenLabs down → queue ulang otomatis, notifikasi user
- Ideogram down → fallback ke DALL-E, atau skip thumbnail (gunakan default)
- Pexels down → gunakan footage dari cache / gunakan gambar statis
- Suno/Mubert down → video tanpa musik latar (pilihan user: lanjut atau tunggu)

---

## 3. Keamanan (Security)

### Autentikasi & Autorisasi

- Login hanya via Google OAuth (NextAuth.js)
- Session token: HttpOnly cookie, SameSite=Strict, Secure
- JWT session dengan expiry 7 hari, refresh otomatis
- Row Level Security (RLS) di Supabase — setiap user hanya akses data sendiri
- API routes dilindungi middleware autentikasi

### API Keys

- API keys pengguna disimpan dengan enkripsi AES-256 di database
- Keys tidak pernah ditampilkan full setelah disimpan (hanya 4 karakter terakhir)
- Keys tidak pernah masuk ke log sistem
- GAS webhook dilindungi dengan shared secret di header

### Data & Privacy

- File video sementara di Vercel Blob dihapus otomatis 24 jam setelah upload ke YouTube
- OAuth refresh token YouTube disimpan encrypted
- Tidak ada data pengguna yang dikirim ke provider AI kecuali konten yang diminta generate
- GDPR-ready: pengguna bisa request hapus semua data

### Transport Security

- Semua komunikasi via HTTPS/TLS 1.3
- Content Security Policy (CSP) header
- Rate limiting di API routes: 60 request/menit per user

---

## 4. Skalabilitas

### Horizontal Scaling

Platform berjalan stateless di Vercel — scaling otomatis sesuai traffic.

### Database Scaling

- Supabase connection pooling via pgBouncer (aktif default)
- Index pada semua kolom yang sering di-query
- Soft delete (bukan hard delete) untuk menjaga integritas data

### Batasan yang Perlu Diperhatikan

| Batasan | Nilai | Mitigasi |
|---|---|---|
| Vercel Function timeout (Hobby) | 10 detik | Gunakan Pro (60 detik) atau background jobs |
| Vercel Function timeout (Pro) | 60 detik | Untuk pipeline panjang, gunakan job queue |
| YouTube API kuota | 10.000 unit/hari | Monitor + request kuota tambahan jika perlu |
| ElevenLabs karakter/bulan | Per plan | Monitor usage, upgrade plan jika perlu |
| Vercel Blob storage | 1GB free tier | Cleanup job, upgrade jika perlu |
| Supabase DB size | 500MB free tier | Arsipkan log lama, upgrade jika perlu |

---

## 5. Observability

### Logging

- Setiap step pipeline dicatat di tabel `pipeline_logs`
- Level: `info`, `warn`, `error`
- Metadata: duration step, cost, response summary (bukan full response)
- Retention: 90 hari

### Monitoring

| Yang Dimonitor | Tool | Alert Kondisi |
|---|---|---|
| Error rate API routes | Vercel Analytics | > 5% error dalam 10 menit |
| Pipeline failure rate | Custom (query DB) | > 20% failure dalam 1 jam |
| Biaya API harian | Custom | > threshold yang diset user |
| YouTube API quota | Custom | > 80% kuota terpakai |

### Error Tracking

- Integrasi Sentry untuk exception tracking di production
- Setiap unhandled error tercatat dengan context: user ID, content ID, step

---

## 6. Maintainability

### Code Quality

- TypeScript strict mode di seluruh codebase
- ESLint + Prettier wajib (CI block jika ada error)
- Unit test untuk provider adapters (Jest)
- Integration test untuk pipeline flow kritis
- Target code coverage: > 70% untuk `lib/` directory

### Dokumentasi

- Setiap provider adapter wajib punya JSDoc
- README setup guide harus selalu up-to-date
- Changelog diupdate setiap release

### Dependency Management

- Audit dependency setiap bulan (`npm audit`)
- Update minor versions mingguan (Dependabot)
- Update major versions manual dengan testing

---

## 7. Compliance

| Requirement | Implementasi |
|---|---|
| YouTube Terms of Service | Tidak upload konten yang melanggar; rate limit upload sesuai kuota |
| AI Provider Terms | Tidak menyalahgunakan API; konten komersial sesuai plan berbayar |
| Copyright footage | Hanya gunakan Pexels (lisensi bebas komersial) |
| GDPR (jika ada user EU) | Privacy policy, data deletion request, cookie consent |
| Konten AI YouTube | Tambahkan label "Made with AI assistance" di deskripsi (best practice) |

---

## 8. Disaster Recovery

| Skenario | Prosedur |
|---|---|
| Database Supabase down | Supabase punya daily backup otomatis; RTO < 1 jam |
| Pipeline gagal di tengah jalan | Idempotent steps — resume dari step terakhir yang gagal |
| API key provider kadaluarsa | Notifikasi 7 hari sebelum expired (jika ada mekanisme expiry) |
| Video gagal upload ke YouTube | Simpan di Blob, retry manual dari dashboard, extend expiry |
| Vercel deployment error | Rollback otomatis ke deployment sebelumnya (Vercel feature) |
