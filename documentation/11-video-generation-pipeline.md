# PRD — YouTube Content Automation Platform
## Dokumen 11: Full AI Video Generation Pipeline

---

## 1. Overview: Pipeline Baru vs Lama

### Lama (v1.x)
```
Script → Voice → [Cari stock footage Pexels] → Render
```

### Baru (v2.0)
```
Script → Shot List → [Generate AI video per shot PARALEL] → AI Director Review → Render
```

Perbedaan kunci: setiap shot di-generate khusus sesuai narasi. Tidak ada footage generik.

---

## 2. Arsitektur Pipeline Lengkap

```
INPUT: topik + template + budget mode
         │
         ▼
┌─────────────────────────────────┐
│  STEP 1: Brief & Research       │
│  Grok + Web Search              │
│  → angle, hook, outline         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  STEP 2: Script + Shot List     │
│  Grok                           │
│  → script segments              │
│  → shot list JSON per segmen    │
│  → thumbnail prompt             │
│  → SEO metadata                 │
└──────────────┬──────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌─────────────────────────────┐
│STEP 3a │ │STEP 3b │ │  STEP 3c: Video Generation  │
│Voice   │ │Music   │ │  Per shot → provider matrix  │
│ElevenL │ │Mubert  │ │  Shot 1 → Kling              │
└───┬────┘ └───┬────┘ │  Shot 2 → Luma               │
    │          │      │  Shot 3 → Runway              │
    │          │      │  Shot N → ... (paralel)       │
    │          │      └──────────────┬────────────────┘
    │          │                     │
    │          │      ┌──────────────▼────────────────┐
    │          │      │  STEP 4: AI Director Review   │
    │          │      │  Grok Vision                  │
    │          │      │  → cek kualitas tiap klip     │
    │          │      │  → susun urutan final         │
    │          │      │  → flag klip yang perlu redo  │
    │          │      └──────────────┬────────────────┘
    │          │                     │
    └──────────┴──────────┐          │
                          ▼          ▼
              ┌───────────────────────────────┐
              │  STEP 5: Thumbnail Generation │
              │  Ideogram (3 variasi)          │
              └──────────────┬────────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │  STEP 6: Render & Assembly    │
              │  FFmpeg / Remotion            │
              │  → gabung semua klip          │
              │  → overlay audio              │
              │  → subtitle                   │
              │  → intro/outro animasi        │
              └──────────────┬────────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │  STEP 7: Review (opsional)    │
              │  User preview di dashboard    │
              └──────────────┬────────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │  STEP 8: Upload & Schedule    │
              │  YouTube Data API             │
              │  → metadata SEO optimal       │
              │  → thumbnail terpilih         │
              │  → jadwal publish             │
              └───────────────────────────────┘
```

---

## 3. Step 1: Brief & Research

### Input
```typescript
interface BriefInput {
  topic: string
  targetAudience: string
  channelNiche: string
  tone: 'educational' | 'entertaining' | 'inspirational' | 'news'
  targetDurationMin: number
}
```

### Proses
Grok melakukan analisis topik dengan web search untuk memastikan konten relevan dan akurat.

```typescript
// lib/pipeline/steps/research.ts
export async function researchStep(input: BriefInput): Promise<ResearchOutput> {
  const searchResults = await webSearch([
    `${input.topic} terbaru 2025`,
    `${input.topic} fakta penting`,
    `${input.topic} trending`,
  ])

  const analysis = await grok.chat({
    system: `Kamu adalah research analyst untuk content YouTube.
             Analisis topik dan identifikasi: angle terbaik, fakta kunci,
             hook yang menarik, dan potensi viral.`,
    user: `Topik: ${input.topic}
           Search results: ${JSON.stringify(searchResults)}
           Buat brief konten dalam JSON.`,
  })

  return analysis
}
```

### Output
```typescript
interface ResearchOutput {
  bestAngle: string
  keyFacts: string[]
  suggestedHook: string
  competitorGap: string      // Apa yang belum dibahas kompetitor
  viralPotential: 'low' | 'medium' | 'high'
  recommendedDuration: number
}
```

---

## 4. Step 2: Script + Shot List Generation

Ini adalah step terpenting — kualitas shot list menentukan kualitas video final.

### Prompt Structure untuk Shot List

```typescript
const SHOT_LIST_PROMPT = `
Kamu adalah scriptwriter dan video director profesional YouTube.

Tugas:
1. Tulis script narasi lengkap
2. Pecah jadi segments (tiap segment = 1 shot video)
3. Tiap shot HARUS punya prompt video AI yang:
   - Spesifik dan visual (bukan abstrak)
   - Menyebutkan: subjek, aksi, setting, mood, lighting
   - Maksimal 2 kalimat
   - Hindari: teks di video, wajah yang dikenali, logo brand

Tipe shot yang tersedia:
- establishing_shot: opening scene, set the mood
- broll_action: visualisasi aksi dari narasi
- broll_abstract: visualisasi konsep abstrak
- close_up: detail objek atau produk
- presenter: host/presenter berbicara (jika channel punya avatar)

Format output: JSON sesuai schema berikut.
`

interface ShotListOutput {
  titleOptions: string[]         // 5 opsi judul
  selectedTitle: string
  description: string
  tags: string[]
  chapters: Chapter[]
  shots: Shot[]
  thumbnailPrompt: string
}

interface Shot {
  id: string
  segment: number                // Urutan shot ke-N
  narrativeText: string          // Teks narasi yang diucapkan
  durationEstimate: number       // Estimasi detik
  shotType: ShotType
  videoPrompt: string            // Prompt untuk AI video generator
  negativePrompt: string         // Apa yang TIDAK mau muncul
  cameraMovement: 'static' | 'pan_left' | 'pan_right' | 'zoom_in' | 'zoom_out' | 'tilt_up' | 'tilt_down'
  mood: string                   // 'cinematic' | 'energetic' | 'calm' | 'dramatic'
}
```

### Contoh Output Shot List

```json
{
  "selectedTitle": "5 Fakta Tersembunyi tentang Otak Manusia yang Mengubah Hidupmu",
  "shots": [
    {
      "id": "shot_001",
      "segment": 1,
      "narrativeText": "Otak manusia adalah organ paling kompleks di alam semesta. Tapi tahukah kamu, ada fakta-fakta tentangnya yang bahkan ilmuwan pun baru mengetahuinya?",
      "durationEstimate": 10,
      "shotType": "establishing_shot",
      "videoPrompt": "Cinematic macro shot of glowing neural connections inside a human brain, electric blue synapses firing in slow motion, dark background, ultra realistic, 4K",
      "negativePrompt": "text overlay, cartoon, unrealistic colors, watermark",
      "cameraMovement": "zoom_in",
      "mood": "dramatic"
    },
    {
      "id": "shot_002",
      "segment": 2,
      "narrativeText": "Fakta pertama: otakmu menghasilkan listrik yang cukup untuk menyalakan sebuah lampu bohlam kecil.",
      "durationEstimate": 8,
      "shotType": "broll_abstract",
      "videoPrompt": "Abstract visualization of electrical energy flowing through neural pathways, warm golden light, cinematic depth of field, scientific aesthetic",
      "negativePrompt": "text, labels, diagram arrows, cartoon",
      "cameraMovement": "pan_right",
      "mood": "cinematic"
    }
  ]
}
```

---

## 5. Step 3c: Parallel Video Generation

Semua shot di-generate secara paralel untuk mempersingkat waktu total.

```typescript
// lib/pipeline/steps/video-generation.ts

export async function generateAllShots(
  shots: Shot[],
  budgetMode: BudgetMode,
  template: Template
): Promise<GeneratedShot[]> {

  // Batasi concurrent generations (cost & rate limit control)
  const MAX_CONCURRENT = budgetMode === 'economy' ? 3 : 5

  const results: GeneratedShot[] = []
  const queue = [...shots]

  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_CONCURRENT)

    const batchResults = await Promise.allSettled(
      batch.map(shot => generateSingleShot(shot, budgetMode, template))
    )

    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i]
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        // Retry dengan provider fallback
        const retried = await retryWithFallback(batch[i], budgetMode)
        results.push(retried)
      }
    }
  }

  return results.sort((a, b) => a.segment - b.segment)
}

async function generateSingleShot(
  shot: Shot,
  budgetMode: BudgetMode,
  template: Template
): Promise<GeneratedShot> {

  const provider = await selectProvider(shot.shotType, budgetMode)

  const startTime = Date.now()
  const output = await provider.generate({
    prompt: enhancePrompt(shot.videoPrompt, template.stylePrefix),
    negativePrompt: shot.negativePrompt,
    duration: Math.min(Math.ceil(shot.durationEstimate), 10),
    aspectRatio: template.aspectRatio,
    cameraMovement: shot.cameraMovement,
  })

  return {
    shotId: shot.id,
    segment: shot.segment,
    videoUrl: output.videoUrl,
    durationSeconds: output.durationSeconds,
    provider: provider.name,
    generationTimeMs: Date.now() - startTime,
    costUsd: provider.estimateCost({ duration: output.durationSeconds }),
  }
}

// Tambahkan style prefix dari template untuk konsistensi visual
function enhancePrompt(prompt: string, stylePrefix?: string): string {
  if (!stylePrefix) return prompt
  return `${stylePrefix}, ${prompt}`
}
```

---

## 6. Step 4: AI Director Review

AI Vision mereview semua klip yang digenerate sebelum dirakit.

```typescript
// lib/pipeline/steps/ai-director.ts

export async function aiDirectorReview(
  shots: GeneratedShot[],
  originalShotList: Shot[]
): Promise<DirectorOutput> {

  // Kirim semua klip ke Grok untuk direview
  // Grok mendapat screenshot/thumbnail tiap klip + metadata
  const reviewPrompt = `
Kamu adalah video director profesional YouTube.
Review klip-klip berikut dan berikan keputusan:

${shots.map(s => `
Shot ${s.segment}: ${s.videoUrl}
Prompt asli: ${originalShotList.find(o => o.id === s.shotId)?.videoPrompt}
Durasi: ${s.durationSeconds}s
`).join('\n')}

Untuk setiap klip, tentukan:
1. APPROVE: klip layak dipakai
2. REGENERATE: kualitas kurang, perlu generate ulang
3. SKIP: tidak diperlukan, potong dari video

Juga tentukan urutan final yang paling mengalir.
Output dalam JSON.
`

  const review = await grok.chat({ user: reviewPrompt })

  // Regenerate klip yang di-flag
  const toRegenerate = review.decisions
    .filter(d => d.action === 'REGENERATE')

  const regenerated = await Promise.all(
    toRegenerate.map(d =>
      generateSingleShot(
        originalShotList.find(s => s.id === d.shotId)!,
        'standard',
        template
      )
    )
  )

  return {
    approvedShots: review.decisions
      .filter(d => d.action === 'APPROVE')
      .map(d => shots.find(s => s.shotId === d.shotId)!),
    regeneratedShots: regenerated,
    finalOrder: review.finalOrder,
    cuttingSuggestions: review.cuttingSuggestions,
  }
}
```

---

## 7. Step 6: Video Assembly dengan FFmpeg

```typescript
// lib/video/assembler.ts

export async function assembleVideo(params: AssemblyParams): Promise<string> {
  const {
    shots,           // Ordered array of video clips
    voiceoverPath,   // MP3 dari ElevenLabs
    musicPath,       // MP3 dari Mubert/Suno
    subtitlePath,    // SRT dari timestamp ElevenLabs
    outputPath,
    template,
  } = params

  // Step 1: Concat semua klip video
  const concatFile = await createConcatFile(shots)

  // Step 2: Build FFmpeg command
  const ffmpegArgs = [
    // Input: concat video
    '-f', 'concat', '-safe', '0', '-i', concatFile,
    // Input: voiceover
    '-i', voiceoverPath,
    // Input: background music
    '-i', musicPath,
    // Filter complex: mix audio + subtitle
    '-filter_complex', buildFilterComplex(params),
    // Video codec
    '-c:v', 'libx264',
    '-crf', '18',
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    // Audio codec
    '-c:a', 'aac',
    '-b:a', '192k',
    // Output
    '-movflags', '+faststart',
    outputPath
  ]

  await runFFmpeg(ffmpegArgs)
  return outputPath
}

function buildFilterComplex(params: AssemblyParams): string {
  return [
    // Audio ducking: musik lebih pelan saat ada narasi
    `[2:a]volume=0.12[music_quiet]`,
    `[1:a][music_quiet]amix=inputs=2:duration=first:dropout_transition=2[mixed_audio]`,
    // Subtitle overlay
    `[0:v]subtitles=${params.subtitlePath}:force_style='FontName=Arial,FontSize=18,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2,Alignment=2'[video_sub]`,
    // Scale ke resolusi target
    `[video_sub]scale=${params.template.width}:${params.template.height}[final_video]`,
  ].join(';')
}
```

---

## 8. Estimasi Waktu Pipeline per Mode

| Mode | Klip video | Provider | Est. Waktu | Est. Biaya |
|---|---|---|---|---|
| Economy | 8 klip × 5 dtk | Hailuo AI | ~8–12 menit | ~$1.50 |
| Standard | 10 klip × 5 dtk | Kling Std | ~12–18 menit | ~$4.50 |
| Premium | 12 klip × 8 dtk | Kling Pro | ~20–30 menit | ~$14.00 |
| Ultra | 10 klip × 8 dtk | VEO 3 | ~25–40 menit | ~$28.00 |
| Presenter | Full video | Heygen | ~5–10 menit | ~$1.50 |

---

## 9. Fallback Chain

```typescript
const FALLBACK_CHAIN: VideoProviderName[][] = [
  ['kling', 'runway', 'hailuo'],      // Standar
  ['veo3', 'kling', 'runway'],        // Premium
  ['hailuo', 'runway'],               // Economy
  ['heygen'],                         // Presenter (no fallback)
]

async function retryWithFallback(
  shot: Shot,
  budgetMode: BudgetMode,
  attempt = 0
): Promise<GeneratedShot> {
  const chain = FALLBACK_CHAIN[budgetModeIndex(budgetMode)]
  if (attempt >= chain.length) {
    throw new Error(`All providers failed for shot: ${shot.id}`)
  }

  try {
    const provider = getProvider(chain[attempt])
    return await generateSingleShot(shot, budgetMode, provider)
  } catch (err) {
    console.warn(`Provider ${chain[attempt]} failed, trying next...`, err)
    return retryWithFallback(shot, budgetMode, attempt + 1)
  }
}
```
