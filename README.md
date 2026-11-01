# Raga Fit

Aplikasi pencatat latihan untuk pemula. PWA mobile-first, dark mode, bahasa Indonesia.
Stack: **Next.js 16 (App Router) + Tailwind CSS v4 + Supabase**.

Dokumen: `docs/RENCANA-PERBAIKAN.md` (rencana & status perbaikan), masterplan awal di `docs/`,
referensi UI di `docs/design/` (acuan utama: `stitch_raga_workout_tracker_ui`).

## Layar

| Rute | Isi |
| --- | --- |
| `/login`, `/daftar` | Masuk / Daftar (nama, email, password + konfirmasi) |
| `/onboarding` | Lokasi, jumlah & pilihan hari, fokus, ringkasan program. Juga dipakai untuk ubah program |
| `/dashboard` | Strip minggu ini, kartu "Latihan berikutnya" (bisa dimulai hari apa saja), daftar program |
| `/sesi/[id]` | Sesi latihan: satu gerakan per layar, set KG/rep, timer istirahat & timer durasi |
| `/sesi/[id]/ringkasan` | Durasi, total set, total beban/repetisi, rekor baru |
| `/riwayat` | Sesi terakhir + progres per gerakan (terakhir & rekor) |
| `/profil` | Nama, kenaikan beban per tap (1 / 2,5 / 5 kg), ubah program, keluar |

## Konsep penting

- **Program = rotasi Latihan A, B, C, …** (3–5 latihan), tidak terikat hari. Hari pilihan user
  hanya rencana; "latihan berikutnya" = latihan setelah sesi terakhir yang selesai.
- **Sesi** (`workout_sessions`) menyimpan salinan judul & gerakan, jadi riwayat aman walau program diganti.
  Log set terikat ke sesi: `unique (session_id, exercise_id, set_number)`.
- **Tanggal** dihitung di zona waktu user (`profiles.timezone`, terdeteksi saat onboarding),
  bukan zona server. Lihat `src/lib/date.ts`.
- **Penyimpanan set**: UI berubah seketika, penyimpanan lewat antrean di belakang
  (`src/components/workout/useSyncQueue.ts`) dengan retry otomatis saat sinyal kembali.
  Draf sesi + antrean disimpan di localStorage, jadi refresh/tutup tab tidak menghilangkan progres.
- **Beban**: tombol +/- selalu mendarat di kelipatan langkah (bawaan 1 kg); angka bisa diketuk
  untuk diketik. Lihat `src/lib/weight.ts`.
- Auto-isi nilai terakhir lewat RPC `get_last_exercise_logs(ids, exclude_session)`.
- Timer istirahat & durasi berbasis timestamp + Wake Lock.

## Environment Variables

| Variabel | Sumber |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → Publishable key |

Keduanya aman untuk publik; RLS memastikan tiap user hanya melihat datanya sendiri.

## Menjalankan lokal

```bash
cp .env.local.example .env.local   # isi URL + publishable key
npm install
npm run dev
```

## Database

Jalankan `supabase/schema.sql` di Supabase SQL Editor. Script ini **mereset** tabel lama
(data latihan lama terhapus, akun tetap ada dan profilnya dibuat ulang).

Pengaturan Supabase: Authentication → Email → "Confirm email" boleh nonaktif (alur daftar
juga menangani mode konfirmasi email aktif).

## Deploy ke Vercel

1. Import repo di Vercel (Next.js terdeteksi otomatis).
2. Tambahkan dua environment variable di atas (Production + Preview).
3. Tambahkan domain Vercel ke Supabase → Authentication → URL Configuration.

## Perintah

| Perintah | Isi |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (tanggal, generator program, aturan beban) |
| `npm run check-exercises` | Validasi 81 gerakan × 2 gambar di jsDelivr |

## Katalog gerakan

`src/data/exercises.ts`: 81 gerakan dari [free-exercise-db](https://github.com/yuhonas/free-exercise-db),
gambar via jsDelivr dengan commit SHA terkunci. `id` tidak boleh diganti setelah ada log.
