# Product Requirements Document (PRD) - YT-Automator (MVP)

## 1. Ringkasan Eksekutif
YT-Automator adalah aplikasi berbasis web yang dirancang untuk membantu kreator konten menjadwalkan dan mengotomatisasi proses pengunggahan video ke YouTube. Aplikasi ini memisahkan antarmuka pengguna (*frontend*) yang dikelola di Vercel dengan mesin otomatisasi (*backend*) yang berjalan sepenuhnya di atas ekosistem Google (Apps Script, Sheets, dan Drive).

**Tujuan Utama:** Menghilangkan tugas repetitif dalam mengunggah video ke YouTube secara manual, memungkinkan pengguna merencanakan puluhan konten di awal, dan sistem akan mengunggahnya sesuai jadwal yang ditentukan.

## 2. Fitur Utama (MVP)
* **Formulir Input Metadata:** Antarmuka web bagi pengguna untuk memasukkan metadata video (Judul, Deskripsi, Tag, Kategori, Visibilitas, dan Jadwal Tayang) beserta ID file Google Drive dari video yang akan diunggah.
* **Sistem Antrean (Queue System):** Pencatatan metadata ke dalam *database* (Google Sheets) dengan status pelacakan secara *real-time* (Pending, Uploading, Success, Failed).
* **Otomatisasi Pengunggahan (Auto-Uploader):** Mesin pekerja di latar belakang yang memeriksa *database* secara berkala, mengambil file video dari penyimpanan, dan mengirimkannya ke YouTube.
* **Pembaruan Status Otomatis:** Sistem yang mengubah status di *database* dari "Pending" menjadi "Success" dan menyertakan URL video YouTube setelah proses pengunggahan selesai.

## 3. Alur Pengguna (User Flow)
1.  **Persiapan Berkas:** Pengguna mengunggah file video mentah (`.mp4`, `.mov`) ke folder spesifik di Google Drive.
2.  **Input Data:** Pengguna membuka *dashboard* web YT-Automator (diakses via Vercel).
3.  **Pengisian Formulir:** Pengguna mengisi formulir yang berisi ID Google Drive dari video tersebut, beserta metadata YouTube (Judul, Deskripsi, Tag, Jadwal).
4.  **Penyimpanan:** Saat formulir dikirim, aplikasi web meneruskan data tersebut ke Google Apps Script (GAS) via API (HTTP POST). GAS menyimpan baris baru di Google Sheets dengan status "Pending".
5.  **Eksekusi Otomatis:** *Time-driven trigger* (CRON) dari GAS berjalan setiap jam (atau sesuai pengaturan). Skrip memindai baris berstatus "Pending" yang jadwal tayangnya sudah masuk atau terlewat.
6.  **Proses Upload:** GAS mengambil aliran data (*blob*) video dari Google Drive, membungkusnya dengan metadata, dan melakukan permintaan POST ke YouTube Data API.
7.  **Selesai:** Setelah berhasil, status di Google Sheets berubah menjadi "Success" bersama dengan link YouTube yang baru saja diunggah.

## 4. Kebutuhan Teknis (Arsitektur Sistem)

### Frontend (Antarmuka Pengguna)
* **Framework:** Next.js (React) atau HTML/Vanilla JS murni.
* **Hosting:** Vercel.
* **Fungsi API:** Melakukan `fetch` (POST/GET) ke URL *Web App* Google Apps Script.

### Backend & Otomatisasi
* **Engine:** Google Apps Script (GAS).
* **Endpoint:** Menggunakan fungsi `doPost(e)` untuk menerima data dari Vercel, dan `doGet(e)` jika ingin menampilkan data status ke *dashboard*.
* **Scheduler:** *Time-driven triggers* bawaan GAS.

### Database & Penyimpanan
* **Database Utama:** Google Sheets (Kolom: `ID`, `Drive_File_ID`, `Title`, `Description`, `Tags`, `Schedule`, `Status`, `YouTube_URL`).
* **Penyimpanan Video:** Google Drive.

### Layanan Pihak Ketiga
* **YouTube Data API v3:** Diaktifkan melalui Google Cloud Console dengan otorisasi OAuth 2.0 (atau kredensial bawaan layanan Google).

## 5. Batasan & Risiko Sistem (Constraints)
* **Batas Eksekusi GAS:** Google Apps Script memiliki batas waktu eksekusi maksimal 6 menit per skrip. Video dengan ukuran file sangat besar (Gigabyte) berisiko gagal diunggah karena *timeout*. Solusi MVP: Batasi ukuran file video (misalnya di bawah 100MB - 500MB untuk konten *Shorts* atau resolusi standar).
* **Batas Kuota YouTube API:** Mengunggah video menghabiskan 1.600 unit kuota dari total 10.000 unit per hari yang diberikan gratis oleh Google Cloud. Maksimal pengunggahan harian di tahap awal adalah sekitar 6 video per *project*.
* **Keamanan Eksekusi (CORS):** Pengaturan *Web App* GAS harus disetel ke *"Execute as: Me"* dan *"Who has access: Anyone"* agar Vercel dapat mengirimkan permintaan HTTP POST tanpa terblokir sistem autentikasi Google.

## 6. Peta Jalan Pengembangan (Future Scaling)
* **Bypass Limitasi Waktu:** Memindahkan logika *upload* (Backend) dari GAS ke Vercel Serverless Functions (Node.js) atau server VPS mandiri untuk menghandle video berukuran besar.
* **Generasi Konten Otomatis:** Integrasi API LLM (Gemini/ChatGPT) pada *dashboard* Vercel. Pengguna cukup memasukkan kata kunci, sistem akan meracik Judul dan Deskripsi SEO-friendly secara mandiri.
* **Migrasi Database:** Mengganti Google Sheets dengan PostgreSQL (via Supabase) agar pencarian dan manajemen data lebih kokoh saat data mencapai puluhan ribu baris.
* **Multi-Channel Support:** Menambahkan sistem OAuth 2.0 di *frontend* agar pengguna bisa mengelola lebih dari satu channel YouTube dalam satu *dashboard*.
