# PRD — YouTube Content Automation Platform
## Dokumen 13: Budget Modes & Cost Management

---

## 1. Konsep Budget Mode

Pengguna memilih mode sebelum generate — sistem menyesuaikan provider dan kualitas output.

```
Economy    → Hailuo AI  → ~$1.50/video  → Cocok untuk channel baru, volume tinggi
Standard   → Kling AI   → ~$4.50/video  → Keseimbangan kualitas & biaya terbaik
Premium    → Kling Pro  → ~$14.00/video → Channel monetisasi aktif
Ultra      → VEO 3      → ~$28.00/video → Konten hero / viral push
Presenter  → Heygen     → ~$2.00/video  → Channel dengan host AI
```

---

## 2. Rincian Biaya Per Mode

### Economy Mode (~$1.50/video)

| Komponen | Provider | Biaya |
|---|---|---|
| Script + metadata | Grok Mini | $0.02 |
| Voiceover | ElevenLabs Starter | $0.08 |
| Background music | Mubert | $0.02 |
| Video clips (8 × 6 dtk) | Hailuo AI | $0.96 |
| Thumbnail (1 opsi) | Stability AI | $0.01 |
| Compute | Vercel | $0.02 |
| **Total** | | **~$1.11** |

Cocok untuk: channel faceless volume tinggi, konten abstrak/nature, testing topik baru.

---

### Standard Mode (~$4.50/video)

| Komponen | Provider | Biaya |
|---|---|---|
| Script + metadata | Grok | $0.05 |
| Voiceover | ElevenLabs Creator | $0.11 |
| Background music | Mubert | $0.02 |
| Video clips (10 × 5 dtk) | Kling AI Std | $4.00 |
| Thumbnail (3 opsi) | Ideogram | $0.24 |
| Compute | Vercel | $0.03 |
| **Total** | | **~$4.45** |

Cocok untuk: channel berkembang, konten edukasi dan tutorial, brand UMKM.

---

### Premium Mode (~$14/video)

| Komponen | Provider | Biaya |
|---|---|---|
| Script + riset | Grok | $0.08 |
| Voiceover | ElevenLabs Pro | $0.20 |
| Background music | Suno | $0.10 |
| Video clips (12 × 8 dtk) | Kling AI Pro | $13.44 |
| Thumbnail (3 opsi + teks) | Ideogram V2 | $0.24 |
| AI Director review | Grok Vision | $0.05 |
| Compute | Vercel | $0.05 |
| **Total** | | **~$14.16** |

Cocok untuk: channel monetisasi aktif, konten viral target, brand menengah.

---

### Ultra Mode (~$28/video)

| Komponen | Provider | Biaya |
|---|---|---|
| Script + riset mendalam | Grok | $0.10 |
| Voiceover | ElevenLabs Pro | $0.20 |
| Background music | Suno | $0.10 |
| Video clips (10 × 8 dtk) | VEO 3 | $28.00 |
| Thumbnail (5 opsi) | Ideogram V2 | $0.40 |
| AI Director review | Grok Vision | $0.10 |
| Compute | Vercel | $0.05 |
| **Total** | | **~$28.95** |

Cocok untuk: konten hero channel besar, video viral campaign, brand enterprise.

---

### Presenter Mode (~$2/video)

| Komponen | Provider | Biaya |
|---|---|---|
| Script | Grok | $0.05 |
| Presenter video (5 mnt) | Heygen | $1.50 |
| B-roll (5 klip × 5 dtk) | Hailuo AI | $0.60 |
| Background music | Mubert | $0.02 |
| Thumbnail (3 opsi) | Ideogram | $0.24 |
| Compute | Vercel | $0.02 |
| **Total** | | **~$2.43** |

Cocok untuk: channel edukasi, tutorial, review produk, brand yang butuh "wajah".

---

## 3. Cost Guard System

Sistem proteksi agar biaya tidak melebihi budget yang ditetapkan.

```typescript
// lib/cost/guard.ts

interface CostGuard {
  maxPerVideo: number          // USD, default $20
  maxPerDay: number            // USD, default $50
  maxPerMonth: number          // USD, default $500
  alertThreshold: number       // Persen dari limit (default 80%)
}

export async function checkCostBeforeGenerate(
  estimatedCost: number,
  userId: string,
  guard: CostGuard
): Promise<CostCheckResult> {

  const todayUsage = await getDailyUsage(userId)
  const monthUsage = await getMonthlyUsage(userId)

  if (estimatedCost > guard.maxPerVideo) {
    return { allowed: false, reason: `Estimasi biaya $${estimatedCost} melebihi limit per video $${guard.maxPerVideo}` }
  }

  if (todayUsage + estimatedCost > guard.maxPerDay) {
    return { allowed: false, reason: `Akan melebihi limit harian $${guard.maxPerDay}` }
  }

  if (monthUsage + estimatedCost > guard.maxPerMonth) {
    return { allowed: false, reason: `Akan melebihi limit bulanan $${guard.maxPerMonth}` }
  }

  // Alert jika mendekati threshold
  const dayPercent = (todayUsage + estimatedCost) / guard.maxPerDay * 100
  if (dayPercent > guard.alertThreshold) {
    await sendCostAlert(userId, 'daily', dayPercent)
  }

  return { allowed: true, estimatedCost }
}
```

---

## 4. Estimasi ROI per Mode

Asumsi channel dengan 10.000 views per video, CPM $4:

| Mode | Biaya/video | Revenue/video (est.) | ROI | Break-even views |
|---|---|---|---|---|
| Economy | $1.11 | $40 | 3.503% | ~280 views |
| Standard | $4.45 | $40 | 799% | ~1.112 views |
| Premium | $14.16 | $40 | 183% | ~3.540 views |
| Ultra | $28.95 | $40 | 38% | ~7.237 views |
| Presenter | $2.43 | $40 | 1.547% | ~607 views |

> Catatan: Revenue dari iklan saja. Sponsorship dan affiliate bisa 5–20× lebih tinggi.

---

## 5. Smart Mode — Rekomendasi Otomatis

Sistem merekomendasikan mode berdasarkan data channel:

```typescript
function recommendBudgetMode(channelStats: ChannelStats): BudgetMode {
  const { subscriberCount, avgViewsPerVideo, monthlyRevenue } = channelStats

  if (monthlyRevenue > 500) return 'ultra'
  if (monthlyRevenue > 100) return 'premium'
  if (avgViewsPerVideo > 1000) return 'standard'
  if (subscriberCount > 500) return 'standard'
  return 'economy'
}
```
