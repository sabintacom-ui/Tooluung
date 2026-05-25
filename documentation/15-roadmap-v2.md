# PRD — YouTube Content Automation Platform
## Dokumen 15: Roadmap v2.0 — Full AI Video Platform

---

## 1. Overview Roadmap

```
v1.0 (PRD awal)     → Pipeline dasar, stock footage, 1 channel
v2.0 (dokumen ini)  → Full AI video, multi-provider, multi-platform
v3.0 (roadmap)      → White-label SaaS, marketplace, enterprise
```

---

## 2. Fase Pengembangan v2.0

---

### Fase A — AI Video Core (3–4 minggu)

**Target:** Pipeline lama digantikan sepenuhnya dengan AI video generator.

**Minggu 1:**
- [ ] Implementasi `KlingProvider` class
- [ ] Implementasi `HailuoProvider` class (fallback economy)
- [ ] Implementasi `RunwayProvider` class (fallback standard)
- [ ] Implementasi `VideoProviderSelector` dengan budget mode
- [ ] Update shot list schema di database

**Minggu 2:**
- [ ] Update Grok prompt untuk generate shot list (bukan hanya script)
- [ ] Implementasi `generateAllShots()` dengan parallel execution
- [ ] Retry logic + fallback chain per shot
- [ ] Update pipeline step tracker (tambah steps baru)

**Minggu 3:**
- [ ] Implementasi `LumaProvider`
- [ ] Implementasi `Veo3Provider` (via Vertex AI)
- [ ] Update video assembler untuk handle AI-generated clips
- [ ] Update dashboard: tampilkan progress per shot

**Minggu 4:**
- [ ] Testing end-to-end pipeline economy mode
- [ ] Testing end-to-end pipeline standard mode
- [ ] Cost tracking per provider
- [ ] Bug fix & stabilisasi

**Done when:** 10 video berhasil diproduksi full AI dalam seminggu, zero manual intervention.

---

### Fase B — AI Director + Quality Control (2 minggu)

**Target:** Kualitas video konsisten, tidak ada klip buruk yang lolos ke video final.

- [ ] Implementasi AI Director Review dengan Grok Vision
- [ ] Auto-regenerate klip yang tidak lolos QC
- [ ] Perhitungan skor kualitas per klip
- [ ] Dashboard: tampilkan score dan keputusan director per shot
- [ ] Statistik: berapa % klip yang di-regenerate per provider

---

### Fase C — Heygen Presenter Integration (2 minggu)

**Target:** Channel yang mau pakai presenter AI bisa setup dan produksi.

- [ ] Implementasi `HeygenProvider`
- [ ] Setup flow: upload sample, consent, create avatar
- [ ] Tabel `avatar_profiles`
- [ ] Presenter mode di pipeline
- [ ] Gabung presenter video + B-roll AI

---

### Fase D — Multi-Platform Publisher (3 minggu)

**Target:** Satu produksi → upload ke YouTube + Shorts + TikTok + Instagram.

- [ ] Auto-reformat 16:9 → 9:16 (face detection + smart crop)
- [ ] Versi script pendek untuk Shorts/Reels (max 50 detik)
- [ ] TikTok Content Posting API
- [ ] Instagram Graph API (Reels)
- [ ] Tabel `platform_publishes`
- [ ] Dashboard: lihat status publish per platform

---

### Fase E — Trend Intelligence (2 minggu)

**Target:** Creator tahu topik viral sebelum kompetitor.

- [ ] Integrasi Google Trends API
- [ ] Integrasi YouTube Trending via Data API
- [ ] Integrasi Reddit API
- [ ] Grok analisis dan ranking sinyal
- [ ] Notifikasi trending alert
- [ ] Weekly digest email

---

### Fase F — Revenue Optimizer (2 minggu)

**Target:** Keputusan konten berbasis data monetisasi.

- [ ] CPM intelligence per topik
- [ ] Upload time optimizer
- [ ] Thumbnail A/B test (3 variasi)
- [ ] YouTube Analytics integration (pull data tiap 24 jam)
- [ ] Revenue forecast per video

---

### Fase G — AI Performance Coach (1 minggu)

**Target:** Laporan otomatis + rekomendasi setelah setiap video publish.

- [ ] Drop-off analysis dari YouTube Analytics
- [ ] Grok generate laporan + rekomendasi
- [ ] Email report 72 jam setelah publish
- [ ] Dashboard "lessons learned" per video

---

### Fase H — Auto-Localization (3 minggu)

- [ ] Translate script via Grok (5 bahasa)
- [ ] ElevenLabs multi-language dubbing
- [ ] Lip sync dubbing ke video presenter
- [ ] Multi-channel management (1 channel per bahasa)
- [ ] Translate thumbnail teks

---

### Fase I — White-Label SaaS (6–8 minggu)

- [ ] Multi-tenant architecture
- [ ] Custom domain per tenant
- [ ] Billing system (Stripe)
- [ ] Tenant onboarding flow
- [ ] Tenant admin dashboard
- [ ] Usage limits enforcement
- [ ] Reseller/agensi tier

---

## 3. Checklist Go-Live v2.0

Sebelum launch v2.0 ke production:

- [ ] Economy mode: 20 video berhasil tanpa error
- [ ] Standard mode: 10 video berhasil tanpa error
- [ ] Cost guard berjalan (tidak ada video yang melebihi budget)
- [ ] Fallback chain berjalan (test matikan Kling, pastikan Runway ambil alih)
- [ ] Pipeline time < 20 menit untuk standard mode
- [ ] Zero data loss jika pipeline gagal di tengah jalan
- [ ] Semua biaya tercatat akurat di database
- [ ] Alert email berjalan saat mendekati budget limit

---

## 4. Tech Debt dari v2.0 yang Perlu Diselesaikan di v3.0

| Item | Masalah | Solusi v3.0 |
|---|---|---|
| FFmpeg di Vercel Function | Lambat, memory terbatas | Dedicated render server / Shotstack API |
| Polling provider setiap N detik | Tidak efisien, boros request | Webhook dari provider (jika tersedia) |
| Blob storage untuk video sementara | Bisa mahal jika banyak video | Auto-cleanup job tiap 12 jam |
| Semua shots dalam satu pipeline job | Sulit partial retry | Job per shot individual |
| API keys di database (encrypted) | Security concern | Migrate ke HashiCorp Vault atau AWS Secrets |
