# PRD — YouTube Content Automation Platform
## Dokumen 10: AI Video Providers — Spesifikasi & Integrasi

**Versi:** 2.0.0
**Status:** Draft

---

## 1. Filosofi: Dari Stock Footage ke Full AI Video

Platform versi 1.x menggunakan Pexels API untuk stock footage.
Versi 2.0 mengganti ini sepenuhnya dengan **AI-generated video** per scene.

| Aspek | v1.x (Stock) | v2.0 (Full AI) |
|---|---|---|
| Sumber visual | Footage generik Pexels | 100% original per narasi |
| Kontrol konten | Terbatas keyword | Prompt bebas per shot |
| Kepemilikan | Lisensi CC0, tidak unik | Sepenuhnya milik creator |
| Konsistensi visual | Tidak konsisten antar klip | Bisa dikontrol via style prompt |
| Biaya | Gratis | $0.02–$0.35 per detik |

---

## 2. Provider Landscape 2025

### 2.1 VEO 3 — Google DeepMind

**Status:** Production (via Google Vertex AI / AI Studio)

**Kemampuan:**
- Text-to-video hingga 1080p, 8–16 detik per klip
- Native audio generation (sync suara dengan visual)
- Lip sync realistis untuk presenter
- Physics-aware motion (air, api, gerakan objek natural)
- Pemahaman prompt bahasa natural yang sangat kuat

**Batasan:**
- Hanya tersedia via Vertex AI (butuh Google Cloud project)
- Kuota terbatas, perlu request akses
- Biaya tertinggi di kategori ini

**Integrasi:**

```typescript
// lib/providers/video/veo3.ts
import { VertexAI } from '@google-cloud/vertexai'

interface Veo3Input {
  prompt: string
  durationSeconds: number       // 5–16
  aspectRatio: '16:9' | '9:16'
  referenceImage?: string       // URL gambar sebagai referensi style
}

interface Veo3Output {
  videoUrl: string
  durationSeconds: number
  generationId: string
}

export class Veo3Provider implements VideoProvider<Veo3Input, Veo3Output> {
  name = 'veo3'
  type = 'video' as const

  private client: VertexAI

  constructor() {
    this.client = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT!,
      location: 'us-central1',
    })
  }

  async generate(input: Veo3Input): Promise<Veo3Output> {
    const model = this.client.getGenerativeModel({
      model: 'veo-003',
    })

    const request = {
      contents: [{
        role: 'user',
        parts: [{
          text: input.prompt
        }]
      }],
      generationConfig: {
        videoConfig: {
          durationSeconds: input.durationSeconds,
          aspectRatio: input.aspectRatio,
        }
      }
    }

    // VEO3 adalah async — polling diperlukan
    const operation = await model.generateVideo(request)
    const result = await this.pollUntilComplete(operation.name)

    return {
      videoUrl: result.videoUri,
      durationSeconds: input.durationSeconds,
      generationId: operation.name,
    }
  }

  estimateCost(input: Veo3Input): number {
    return input.durationSeconds * 0.35   // $0.35/detik
  }

  private async pollUntilComplete(operationName: string, maxWaitMs = 300000) {
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      const status = await this.client.checkOperation(operationName)
      if (status.done) return status.response
      await new Promise(r => setTimeout(r, 5000))
    }
    throw new Error('VEO3 generation timeout')
  }
}
```

**Estimasi biaya:** $0.35/detik → klip 8 detik = $2.80

---

### 2.2 Kling AI — Kuaishou Technology

**Status:** Production (API publik tersedia)

**Kemampuan:**
- Text-to-video dan Image-to-video
- Resolusi 720p dan 1080p
- Durasi 5 detik (standar) dan 10 detik (pro)
- Motion brush: kontrol area mana yang bergerak
- Camera movement control (pan, zoom, tilt)
- Model: kling-v1, kling-v1-5, kling-v2 (terbaru)

**Keunggulan vs kompetitor:**
- Kualitas terbaik di harga menengah
- API paling stabil dan well-documented
- Support image-to-video sangat kuat (ideal untuk alur: Ideogram → Kling)

**Integrasi:**

```typescript
// lib/providers/video/kling.ts
const KLING_API = 'https://api.klingai.com/v1'

interface KlingInput {
  prompt: string
  negativePrompt?: string
  imageUrl?: string             // Untuk image-to-video
  duration: 5 | 10
  mode: 'std' | 'pro'
  aspectRatio: '16:9' | '9:16' | '1:1'
  cameraControl?: {
    type: 'simple' | 'advanced'
    config: {
      horizontal?: number       // -10 to 10
      vertical?: number
      zoom?: number
      tilt?: number
    }
  }
}

export class KlingProvider implements VideoProvider<KlingInput, VideoOutput> {
  name = 'kling'

  async generate(input: KlingInput): Promise<VideoOutput> {
    // Step 1: Submit task
    const submitRes = await fetch(`${KLING_API}/videos/text2video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KLING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_name: 'kling-v2',
        prompt: input.prompt,
        negative_prompt: input.negativePrompt ?? 'blurry, low quality, text overlay',
        duration: input.duration,
        mode: input.mode,
        aspect_ratio: input.aspectRatio,
        camera_control: input.cameraControl,
      }),
    })

    const { data: { task_id } } = await submitRes.json()

    // Step 2: Poll until complete (biasanya 1–3 menit)
    return await this.pollTask(task_id)
  }

  private async pollTask(taskId: string): Promise<VideoOutput> {
    while (true) {
      const res = await fetch(`${KLING_API}/videos/text2video/${taskId}`, {
        headers: { 'Authorization': `Bearer ${process.env.KLING_API_KEY}` }
      })
      const { data } = await res.json()

      if (data.task_status === 'succeed') {
        return {
          videoUrl: data.task_result.videos[0].url,
          durationSeconds: data.task_result.videos[0].duration,
          provider: 'kling',
        }
      }
      if (data.task_status === 'failed') {
        throw new Error(`Kling task failed: ${data.task_status_msg}`)
      }

      await new Promise(r => setTimeout(r, 8000))  // Poll tiap 8 detik
    }
  }

  estimateCost(input: KlingInput): number {
    // kling-v2 pro: ~$0.14/detik, std: ~$0.08/detik
    const rate = input.mode === 'pro' ? 0.14 : 0.08
    return input.duration * rate
  }
}
```

**Estimasi biaya:**
| Mode | Harga/detik | Klip 5 dtk | Klip 10 dtk |
|---|---|---|---|
| Standard | $0.08 | $0.40 | $0.80 |
| Pro | $0.14 | $0.70 | $1.40 |

---

### 2.3 Runway Gen-4 — RunwayML

**Status:** Production (API stabil, paling mature)

**Kemampuan:**
- Text-to-video, Image-to-video, Video-to-video
- Extend video (sambung klip yang sudah ada)
- Camera control presets
- Inpainting video
- Resolusi hingga 1280x768

**Keunggulan:** API paling mature, dokumentasi terlengkap, ekosistem integrasi paling luas.

**Integrasi:**

```typescript
// lib/providers/video/runway.ts
import RunwayML from '@runwayml/sdk'

export class RunwayProvider implements VideoProvider {
  name = 'runway'
  private client: RunwayML

  constructor() {
    this.client = new RunwayML({
      apiKey: process.env.RUNWAY_API_KEY!
    })
  }

  async generate(input: RunwayInput): Promise<VideoOutput> {
    const task = await this.client.imageToVideo.create({
      model: 'gen4_turbo',
      promptImage: input.imageUrl,        // Dari Ideogram/DALL-E
      promptText: input.prompt,
      ratio: '1280:768',
      duration: input.duration,           // 5 atau 10
    })

    const result = await task.waitForCompletion()

    return {
      videoUrl: result.output[0],
      durationSeconds: input.duration,
      provider: 'runway',
    }
  }

  estimateCost(input: RunwayInput): number {
    // Gen4 Turbo: ~5 kredit/detik, $0.01/kredit
    return input.duration * 5 * 0.01
  }
}
```

**Estimasi biaya:** ~$0.05/detik → klip 5 detik = $0.25

---

### 2.4 Hailuo AI — MiniMax

**Status:** Production (API publik, paling terjangkau)

**Kemampuan:**
- Text-to-video hingga 720p
- Durasi 6 detik per klip
- Fast generation (~30–60 detik per klip)
- Cocok untuk B-roll, abstrak, dan nature shots

**Integrasi:**

```typescript
// lib/providers/video/hailuo.ts
const HAILUO_API = 'https://api.minimax.io/v1/video_generation'

export class HailuoProvider implements VideoProvider {
  name = 'hailuo'

  async generate(input: HailuoInput): Promise<VideoOutput> {
    const res = await fetch(HAILUO_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HAILUO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'video-01',
        prompt: input.prompt,
      }),
    })

    const { task_id } = await res.json()
    return await this.pollTask(task_id)
  }

  estimateCost(input: HailuoInput): number {
    return 6 * 0.02    // Fixed 6 detik @ $0.02/detik
  }
}
```

**Estimasi biaya:** ~$0.02/detik → klip 6 detik = $0.12

---

### 2.5 Heygen — AI Avatar Presenter

**Status:** Production (API publik, khusus avatar presenter)

**Kemampuan:**
- Generate video presenter AI dari script teks
- Clone suara & wajah creator (perlu upload sample)
- Lip sync akurat ke teks
- Multi bahasa termasuk Bahasa Indonesia
- Template avatar siap pakai

**Kapan digunakan:**
- Channel edukasi yang butuh "host" konsisten
- Brand yang butuh presenter on-brand
- Creator yang tidak mau rekam video sendiri

**Integrasi:**

```typescript
// lib/providers/video/heygen.ts
const HEYGEN_API = 'https://api.heygen.com/v2'

interface HeygenInput {
  script: string
  avatarId: string         // ID avatar (bisa custom clone atau preset)
  voiceId: string          // Clone suara atau preset
  backgroundId?: string    // Background virtual
  dimension: {
    width: 1280
    height: 720
  }
}

export class HeygenProvider implements VideoProvider {
  name = 'heygen'

  async generate(input: HeygenInput): Promise<VideoOutput> {
    const res = await fetch(`${HEYGEN_API}/video/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: input.avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: input.script,
            voice_id: input.voiceId,
            speed: 1.0,
          },
          background: input.backgroundId
            ? { type: 'library', value: input.backgroundId }
            : { type: 'color', value: '#FFFFFF' },
        }],
        dimension: input.dimension,
      }),
    })

    const { data: { video_id } } = await res.json()
    return await this.pollVideo(video_id)
  }

  estimateCost(input: HeygenInput): number {
    const words = input.script.split(' ').length
    const estimatedMinutes = words / 150    // ~150 kata/menit
    return estimatedMinutes * 0.30          // $0.30/menit
  }
}
```

---

### 2.6 Luma Dream Machine

**Status:** Production (API publik)

**Kemampuan:**
- Text-to-video dan Image-to-video
- Kualitas sinematik, motion sangat smooth
- Camera movement yang realistis
- Ideal untuk scene-scene estetik, nature, dan establishing shot

**Integrasi:**

```typescript
// lib/providers/video/luma.ts
import LumaAI from 'lumaai'

export class LumaProvider implements VideoProvider {
  name = 'luma'
  private client: LumaAI

  constructor() {
    this.client = new LumaAI({ authToken: process.env.LUMA_API_KEY! })
  }

  async generate(input: LumaInput): Promise<VideoOutput> {
    let generation = await this.client.generations.create({
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio ?? '16:9',
      loop: false,
    })

    while (!['completed', 'failed'].includes(generation.state)) {
      await new Promise(r => setTimeout(r, 3000))
      generation = await this.client.generations.get(generation.id)
    }

    if (generation.state === 'failed') {
      throw new Error(`Luma generation failed: ${generation.failure_reason}`)
    }

    return {
      videoUrl: generation.assets!.video!,
      durationSeconds: 5,
      provider: 'luma',
    }
  }

  estimateCost(): number { return 5 * 0.10 }
}
```

---

## 3. Provider Selection Matrix

Sistem memilih provider otomatis berdasarkan tipe shot:

```typescript
// lib/providers/video/selector.ts

type ShotType =
  | 'realistic_human'     // Orang, wajah, interaksi manusia
  | 'presenter'           // Host/presenter berbicara ke kamera
  | 'nature_landscape'    // Alam, pemandangan, outdoor
  | 'abstract_concept'    // Visualisasi konsep, data, teknologi
  | 'product_showcase'    // Produk, barang, close-up
  | 'cinematic_broll'     // B-roll sinematik umum

const PROVIDER_MATRIX: Record<ShotType, VideoProviderName[]> = {
  realistic_human:   ['veo3', 'kling'],
  presenter:         ['heygen', 'veo3'],
  nature_landscape:  ['luma', 'kling', 'runway'],
  abstract_concept:  ['runway', 'hailuo', 'kling'],
  product_showcase:  ['kling', 'runway', 'veo3'],
  cinematic_broll:   ['luma', 'kling', 'runway'],
}

export async function selectProvider(
  shotType: ShotType,
  budgetMode: 'economy' | 'standard' | 'premium'
): Promise<VideoProvider> {
  const candidates = PROVIDER_MATRIX[shotType]

  const prioritized = budgetMode === 'economy'
    ? [...candidates].sort((a, b) => COST_TABLE[a] - COST_TABLE[b])
    : budgetMode === 'premium'
    ? [...candidates].reverse()
    : candidates

  for (const name of prioritized) {
    const provider = getProvider(name)
    if (await provider.isAvailable()) return provider
  }

  throw new Error(`No available provider for shot type: ${shotType}`)
}
```

---

## 4. Ringkasan Estimasi Biaya

| Provider | Harga/detik | Klip 5 dtk | 10 klip (50 dtk) | Kualitas |
|---|---|---|---|---|
| Hailuo AI | $0.02 | $0.10 | $1.00 | ⭐⭐⭐ |
| Runway Gen-4 | $0.05 | $0.25 | $2.50 | ⭐⭐⭐⭐ |
| Kling AI Std | $0.08 | $0.40 | $4.00 | ⭐⭐⭐⭐ |
| Luma Dream | $0.10 | $0.50 | $5.00 | ⭐⭐⭐⭐ |
| Kling AI Pro | $0.14 | $0.70 | $7.00 | ⭐⭐⭐⭐⭐ |
| VEO 3 | $0.35 | $1.75 | $17.50 | ⭐⭐⭐⭐⭐ |
| Heygen | $0.30/mnt | ~$1.50 (5 mnt) | — | ⭐⭐⭐⭐ |
