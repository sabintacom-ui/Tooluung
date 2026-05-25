# PRD — YouTube Content Automation Platform
## Dokumen 01: User Personas & Use Cases

---

## 1. Segmen Pengguna Target

Platform ini menyasar tiga segmen utama dengan kebutuhan yang berbeda namun dapat dilayani oleh satu platform yang sama.

---

## 2. Persona Detail

### Persona 1 — Andi, Solo Content Creator

| Atribut | Detail |
|---|---|
| **Usia** | 24 tahun |
| **Pekerjaan** | Freelancer + YouTuber part-time |
| **Channel** | Edukasi & tips produktivitas, 8.000 subscriber |
| **Upload saat ini** | 1–2 video/minggu, sering telat jadwal |
| **Pain point** | Kehabisan waktu untuk riset, nulis script, dan edit |
| **Tujuan** | Upload 4–5 video/minggu tanpa burnout |
| **Kemampuan teknis** | Menengah — bisa pakai API tapi tidak ingin setup kompleks |
| **Budget** | Rp 500.000–1.500.000/bulan untuk tools |

**Use Case Utama:**
- Masukkan topik mingguan → sistem generate script, voiceover, dan video faceless
- Review hasil di dashboard, approve, sistem upload otomatis
- Thumbnail dibuat otomatis sesuai template channel

**Quote:** *"Aku mau fokus di ide dan strategi, bukan di editing dan ngetik deskripsi."*

---

### Persona 2 — Sinta, Pemilik Agensi Konten

| Atribut | Detail |
|---|---|
| **Usia** | 32 tahun |
| **Pekerjaan** | Founder agensi digital 5 orang |
| **Klien** | 8 klien UMKM, masing-masing butuh 2–4 video/bulan |
| **Pain point** | Tim terlalu banyak waktu di proses repetitif, sulit scale |
| **Tujuan** | Handle 3x lebih banyak klien tanpa tambah headcount |
| **Kemampuan teknis** | Tinggi — terbiasa dengan API, webhook, workflow automation |
| **Budget** | Rp 3.000.000–8.000.000/bulan untuk tools + API |

**Use Case Utama:**
- Buat template per klien (tone, gaya narasi, palet warna thumbnail)
- Set topik mingguan di spreadsheet → sistem jalankan pipeline untuk semua klien
- Dashboard per klien untuk approval sebelum publish
- Laporan otomatis performa video per klien

**Quote:** *"Kalau pipeline bisa diotomasi, tim saya bisa fokus ke strategi dan relasi klien."*

---

### Persona 3 — Rizal, Brand Manager Perusahaan

| Atribut | Detail |
|---|---|
| **Usia** | 29 tahun |
| **Pekerjaan** | Brand Manager perusahaan menengah |
| **Channel** | Official brand channel, 22.000 subscriber |
| **Pain point** | Produksi lambat, harus lewat banyak approval, konten sering tidak konsisten |
| **Tujuan** | Konten terjadwal, on-brand, dan mudah di-approve tim |
| **Kemampuan teknis** | Rendah–menengah — lebih nyaman dengan UI yang bersih |
| **Budget** | Budget tim, tidak sensitif harga asalkan ada ROI jelas |

**Use Case Utama:**
- Tim marketing input brief → sistem generate draf konten
- Approval workflow sebelum video di-publish
- Semua output mengikuti brand guideline yang sudah dikonfigurasi
- Laporan mingguan performa dikirim otomatis ke email

**Quote:** *"Saya tidak mau pusing soal teknis. Yang penting kontennya sesuai brand dan tayang tepat waktu."*

---

## 3. Anti-Persona (Bukan Target)

| Profil | Alasan Bukan Target |
|---|---|
| Creator gaming bergantung footage gameplay | Pipeline tidak cocok untuk konten rekaman layar real-time kompleks |
| Vlogger kehidupan sehari-hari | Konten personal/raw tidak cocok untuk otomasi AI |
| Creator yang menolak penggunaan AI | Tidak akan mengadopsi produk ini |

---

## 4. User Journey Map

### Journey: Solo Creator (Andi) — Full Auto Mode

```
[Senin pagi]
Andi buka dashboard
  → Input 5 topik untuk minggu ini
  → Pilih template: "Edukasi Singkat 5 Menit"
  → Klik "Generate Semua"

[Sistem bekerja ~10–15 menit]
  → Notifikasi: "5 video siap review"
  → Andi review sekilas tiap video (preview + script)
  → Approve 4 video, revisi 1
  → Set jadwal publish (Selasa–Sabtu jam 17.00)

[Sistem upload otomatis sesuai jadwal]
  → Andi terima laporan performa tiap Jumat
```

---

### Journey: Agensi (Sinta) — Template-Based Mode

```
[Awal bulan]
  → Setup template baru untuk klien baru
    (tone, gaya, palet warna, voice character)

[Tiap Senin]
  → Update spreadsheet topik semua klien
  → GAS trigger baca spreadsheet → kirim ke pipeline
  → Pipeline generate konten semua klien secara paralel

[Review & Approval]
  → Tim review via dashboard (filter per klien)
  → Klien dapat link preview untuk approval
  → Setelah approve → sistem upload sesuai jadwal klien

[Laporan]
  → Laporan performa otomatis dikirim ke klien tiap Jumat
```

---

## 5. Kebutuhan Fungsional Per Persona

| Fitur | Andi | Sinta | Rizal |
|---|---|---|---|
| Generate konten dari topik | Wajib | Wajib | Wajib |
| Template per channel/klien | Opsional | Wajib | Wajib |
| Review & approval sebelum publish | Wajib | Wajib | Wajib |
| Full otomatis tanpa review | Wajib | Opsional | Tidak |
| Multi-channel / multi-klien | Tidak | Wajib | Tidak |
| Laporan performa otomatis | Opsional | Wajib | Wajib |
| Approval workflow tim | Tidak | Wajib | Wajib |
| Cost tracking per video | Opsional | Wajib | Opsional |
| Export laporan ke PDF/Sheets | Opsional | Wajib | Wajib |
