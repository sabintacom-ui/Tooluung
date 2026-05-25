# PRD — YouTube Content Automation Platform
## Dokumen 06: Content Pipeline — Alur Lengkap Step-by-Step

---

## 1. Gambaran Umum Pipeline

Pipeline terdiri dari **7 langkah utama** yang berjalan secara berurutan. Setiap langkah bersifat idempotent — jika gagal dan diulang, tidak akan menghasilkan duplikasi.

```
TRIGGER
  ↓
[1] Generate Script & Metadata  ←── Grok API
  ↓
[2] Generate Voiceover          ←── ElevenLabs API
  ↓
[3] Generate Background Music   ←── Suno / Mubert API (paralel dengan step 2)
  ↓
[4] Generate Thumbnail          ←── Ideogram API (paralel dengan step 2)
  ↓
[5] Fetch Stock Footage         ←── Pexels API (paralel dengan step 2)
  ↓
[6] Render Video                ←── FFmpeg / Remotion
  ↓
[7] Upload ke YouTube           ←── YouTube Data API
  ↓
SELESAI → Notifikasi user
```

> **Catatan paralel:** Step 3, 4, dan 5 bisa berjalan bersamaan setelah step 1 selesai (mereka hanya butuh output script/judul, bukan audio). Step 2 berjalan lebih lama, jadi step 3/4/5 biasanya selesai lebih dulu.

---

## 2. Step 1 — Generate Script & Metadata

### Input
```typescript
{
  topic: string,
  targetAudience: string,
  keywords: string[],
  tone: string,
  targetDurationMin: number,
  template: Template,
  notes?: string
}
```

### Proses
1. Bangun system prompt dari template + input user
2. Kirim ke Grok API dengan format output JSON
3. Validasi response (cek semua field wajib ada)
4. Simpan ke `contents` table

### Output
```typescript
{
  titleOptions: string[],         // 5 pilihan judul
  selectedTitle: string,          // Judul terbaik (dipilih AI)
  description: string,            // Deskripsi YouTube (max 5000 karakter)
  tags: string[],                 // Max 500 karakter total
  chapters: { time: string, title: string }[],
  scriptSegments: {
    segment: string,
    text: string,
    durationEstimate: number,     // Estimasi detik
    footageKeyword: string        // Keyword untuk cari footage
  }[],
  thumbnailPrompt: string,        // Prompt untuk image gen
  footageKeywords: string[]       // Top keyword untuk Pexels
}
```

### Error Handling
- Jika response bukan valid JSON → retry dengan prompt yang diperketat
- Jika token limit terlampaui → potong topik atau gunakan grok-3-mini
- Max retry: 3x

---

## 3. Step 2 — Generate Voiceover

### Input
- `scriptSegments` dari Step 1
- `voiceId`, `voiceStability`, `voiceSimilarity` dari template

### Proses
1. Gabungkan semua segmen script menjadi teks lengkap
2. Bersihkan teks dari formatting yang tidak natural untuk diucapkan
3. Kirim ke ElevenLabs `/text-to-speech/{voice_id}/with-timestamps`
4. Simpan audio MP3 ke Vercel Blob
5. Simpan timestamp tiap kalimat (untuk subtitle sync)

### Output
```typescript
{
  audioUrl: string,           // Vercel Blob URL
  durationSeconds: number,
  timestamps: {
    text: string,
    start: number,            // Milidetik
    end: number
  }[]
}
```

### Penting
- Hapus teks `[pause]` sebelum dikirim ke TTS, ganti dengan `<break time="0.5s"/>` (SSML)
- Split teks jika > 5000 karakter (batas per request ElevenLabs)

---

## 4. Step 3 — Generate Background Music (Paralel)

### Input
- `musicGenre`, `musicMood`, `musicIntensity` dari template
- `durationSeconds` dari output Step 2 (estimasi jika belum selesai)

### Proses
1. Bangun prompt musik berdasarkan mood dan topik video
2. Kirim ke Mubert / Suno API
3. Download audio hasil generasi
4. Simpan ke Vercel Blob

### Output
```typescript
{
  musicUrl: string,           // Vercel Blob URL
  durationSeconds: number,
  mood: string
}
```

---

## 5. Step 4 — Generate Thumbnail (Paralel)

### Input
- `thumbnailPrompt` dari Step 1
- `thumbnailStylePrompt`, `primaryColor`, `accentColor`, `layout` dari template
- `selectedTitle` dari Step 1

### Proses
1. Gabungkan prompt dari script dengan style template
2. Tambahkan instruksi ukuran (1280x720) dan gaya
3. Kirim ke Ideogram API, minta 3 variasi
4. Simpan semua 3 gambar ke Vercel Blob
5. Tandai gambar pertama sebagai `is_selected = true` (default)

### Output
```typescript
{
  thumbnails: {
    url: string,
    isSelected: boolean
  }[]    // Array 3 thumbnail
}
```

---

## 6. Step 5 — Fetch Stock Footage (Paralel)

### Input
- `footageKeywords` dari Step 1 (array 3–5 keyword)
- `videoDurationSec` (estimasi dari script)
- `videoAspectRatio` dari template

### Proses
1. Untuk setiap keyword, query Pexels Video API
2. Filter: durasi 5–30 detik, resolusi min 1080p, landscape
3. Ambil 2–3 klip per keyword
4. Download dan simpan ke Vercel Blob
5. Catat metadata (durasi, resolusi, attributi) untuk video assembler

### Output
```typescript
{
  footage: {
    keyword: string,
    url: string,           // Vercel Blob URL
    durationSeconds: number,
    resolution: string,
    pexelsCredit: string   // Untuk attributi jika diperlukan
  }[]
}
```

---

## 7. Step 6 — Render Video Final

### Input
- Audio voiceover (dari Step 2)
- Background music (dari Step 3)
- Thumbnail selected (dari Step 4) — digunakan sebagai opening frame
- Stock footage clips (dari Step 5)
- Timestamps & script untuk subtitle
- Template config (resolusi, transisi)

### Proses Detail

```
1. Susun timeline video:
   ├── Frame 0–2 detik: Fade in dari thumbnail
   ├── Frame 2–N: Footage bergilir sesuai durasi tiap segmen script
   └── Frame terakhir: Fade out

2. Overlay audio:
   ├── Track 1: Voiceover (volume 100%)
   └── Track 2: Background music (volume 15–20%, ducking saat narasi)

3. Generate & overlay subtitle:
   ├── Format: SRT dari timestamps ElevenLabs
   └── Style: Font putih, shadow hitam, posisi bawah-tengah

4. Composite & render:
   └── Output: MP4 H.264, 1080p, 8 Mbps bitrate
```

### FFmpeg Command (Simplified)

```bash
ffmpeg \
  -i voiceover.mp3 \
  -i music.mp3 \
  -i footage_concat.mp4 \
  -filter_complex "
    [1:a]volume=0.15[music];
    [0:a][music]amix=inputs=2:duration=first[audio];
    [2:v]subtitles=subtitle.srt[video]
  " \
  -map "[video]" \
  -map "[audio]" \
  -c:v libx264 -crf 18 -preset medium \
  -c:a aac -b:a 192k \
  output.mp4
```

### Output
```typescript
{
  videoUrl: string,          // Vercel Blob URL file MP4 final
  durationSeconds: number,
  fileSizeMB: number,
  resolution: string
}
```

---

## 8. Step 7 — Upload ke YouTube

### Input
- `videoUrl` dari Step 6
- Metadata: judul, deskripsi, tags, chapters dari Step 1
- Thumbnail dari Step 4
- Jadwal publish dari `contents.scheduled_at`
- Template playlist target

### Proses
1. Refresh YouTube OAuth token jika expired
2. Inisiasi resumable upload (untuk file besar)
3. Upload file video dalam chunks (8MB per chunk)
4. Set thumbnail via API terpisah
5. Jika ada `scheduled_at` di masa depan → set `privacyStatus: 'private'` + `publishAt`
6. Jika tidak ada jadwal → set sesuai preferensi user (`public` / `private` / `unlisted`)
7. Tambahkan ke playlist jika ada di template
8. Simpan `youtube_video_id` ke tabel `youtube_videos`

### Penting: Resumable Upload

```typescript
// Untuk video > 5MB, gunakan resumable upload
// Ini penting karena Vercel function bisa timeout

async function uploadWithResumable(videoPath: string, metadata: object) {
  // Step 1: Inisiasi upload, dapat upload URL
  const uploadUrl = await initiateResumableUpload(metadata)

  // Step 2: Upload dalam chunks
  const chunkSize = 8 * 1024 * 1024  // 8MB
  // ... upload loop

  // Step 3: Confirm upload selesai, dapat video ID
  return videoId
}
```

---

## 9. Handling Parallelism

```typescript
// Setelah Step 1 selesai, jalankan 3 step paralel
const [voice, music, thumbnail, footage] = await Promise.allSettled([
  generateVoiceover(scriptOutput),          // Step 2
  generateMusic(template),                  // Step 3
  generateThumbnail(scriptOutput, template), // Step 4
  fetchFootage(scriptOutput.footageKeywords) // Step 5
])

// Cek error dari tiap step
// Lanjut ke Step 6 hanya jika minimal voice + footage tersedia
if (voice.status === 'rejected') throw new Error('Voiceover failed')
```

---

## 10. Pipeline di Google Apps Script

GAS berperan sebagai **scheduler eksternal** yang membaca jadwal dari Google Sheets dan men-trigger pipeline di Vercel.

```javascript
// Scheduler.gs — berjalan setiap jam via time-based trigger
function checkAndTriggerPipeline() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const rows = sheet.getDataRange().getValues();

  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header

    const [topic, audience, tone, scheduledDate, status] = row;

    if (status === 'pending' && isTimeToProcess(scheduledDate)) {
      const response = triggerPipeline({
        topic,
        targetAudience: audience,
        tone,
        scheduledAt: scheduledDate
      });

      // Update status di Sheets
      sheet.getRange(index + 1, 5).setValue('processing');
      sheet.getRange(index + 1, 6).setValue(response.contentId);
    }
  });
}

function triggerPipeline(data) {
  const url = PropertiesService.getScriptProperties().getProperty('VERCEL_API_URL');
  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');

  const response = UrlFetchApp.fetch(`${url}/api/pipeline/trigger`, {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'x-webhook-secret': secret },
    payload: JSON.stringify(data)
  });

  return JSON.parse(response.getContentText());
}
```
