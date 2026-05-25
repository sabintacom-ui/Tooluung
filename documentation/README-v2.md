# PRD — YouTube Content Automation Platform v2.0
## Panduan Navigasi

Platform otomasi produksi konten YouTube — full AI video generation tanpa stock footage.
Menggunakan VEO3, Kling AI, Runway, Heygen, dan provider AI video terbaru.

---

## Dokumen v1.x (Fondasi — tetap berlaku)

| File | Isi |
|---|---|
| `00-overview.md` | Executive summary & visi |
| `01-user-personas.md` | Target pengguna & journey |
| `02-features.md` | Fitur lengkap & user stories |
| `03-technical-architecture.md` | Stack & folder structure |
| `04-api-providers.md` | Grok, ElevenLabs, Suno, Pexels, YouTube |
| `05-data-models.md` | Schema database v1 |
| `06-content-pipeline.md` | Pipeline v1 (stock footage) |
| `07-ui-ux.md` | UI/UX requirements |
| `08-roadmap.md` | Roadmap v1 |
| `09-non-functional-requirements.md` | Performa, keamanan, skalabilitas |

---

## Dokumen v2.x (Ekspansi AI Video — dokumen ini)

| File | Isi | Baca Jika... |
|---|---|---|
| `10-ai-video-providers.md` | VEO3, Kling, Runway, Heygen, Hailuo, Luma | Mau integrasi AI video |
| `11-video-generation-pipeline.md` | Pipeline full AI: shot list → generate → assemble | Mau build pipeline v2 |
| `12-additional-modules.md` | Trend engine, multi-platform, localization, SaaS | Mau scale platform |
| `13-budget-modes.md` | Economy/Standard/Premium/Ultra/Presenter mode | Mau implement cost management |
| `14-updated-data-models.md` | Schema baru: video_shots, avatar_profiles, trend_signals | Mau update database |
| `15-roadmap-v2.md` | Timeline fase A–I, checklist go-live | Mau rencanakan sprint |

---

## Quick Reference: Pilih Provider Berdasarkan Kebutuhan

```
Channel baru, budget terbatas     → Hailuo AI  ($0.02/dtk)
Channel berkembang, kualitas baik → Kling AI   ($0.08/dtk)
Channel monetisasi aktif          → Kling Pro  ($0.14/dtk)
Konten hero / viral push          → VEO 3      ($0.35/dtk)
Channel dengan presenter          → Heygen     ($0.30/mnt)
Sinematik / estetik               → Luma       ($0.10/dtk)
```

---

## Urutan Implementasi yang Disarankan

```
1. Setup fondasi (dokumen v1.x) — 2–3 minggu
2. Integrasi Kling AI sebagai provider utama (Fase A)
3. Tambah Hailuo sebagai fallback economy (Fase A)
4. AI Director review (Fase B)
5. Multi-platform publisher (Fase D) — high ROI
6. Trend Intelligence (Fase E) — competitive advantage
7. Revenue Optimizer (Fase F) — monetization
8. Heygen presenter (Fase C) — jika channel butuh presenter
9. Localization (Fase H) — scale revenue
10. White-label SaaS (Fase I) — B2B monetization
```
