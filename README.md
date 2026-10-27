# Raga Fit

Aplikasi pencatat latihan untuk pemula — PWA mobile-first, dark mode, bahasa Indonesia.
Stack: **Next.js (App Router) + Tailwind CSS v4 + Supabase**. Referensi rencana: `Masterplan MVP Lite Aplikasi Pencatat Latihan untuk Pemula.md`.

## Layar (MVP Lite)

1. Login / Daftar — `/login`
2. Onboarding 3 pertanyaan + ringkasan — `/onboarding`
3. Dashboard jadwal mingguan — `/dashboard`
4. Layar latihan satu gerakan per layar (portrait & landscape ponsel) — `/workout/[1-7]`
5. Latihan selesai (durasi, total set, total beban)

## Menjalankan

```bash
cp .env.local.example .env.local   # isi dari Supabase → Settings → API (URL + publishable key)
npm install
npm run dev
```

Penting (Windows): pastikan variabel `NODE_ENV=production` tidak ter-set global saat
menginstall, karena npm akan melewatkan devDependencies.

## Database

Jalankan `supabase/schema.sql` di Supabase SQL Editor (tables + trigger + RLS + RPC).

## Perintah

| Perintah | Isi |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (helper tanggal + generator jadwal) |
| `npm run check-exercises` | Validasi 81 id × 2 gambar di jsDelivr (SHA terkunci) |

## Katalog gerakan

`src/data/exercises.ts` — 81 gerakan dari
[free-exercise-db](https://github.com/yuhonas/free-exercise-db), gambar disajikan via
jsDelivr dengan commit SHA terkunci. Aturan: `id` tidak boleh diganti setelah ada log;
hanya `name`, `tips`, `autoPick` yang boleh diedit, dan wajib `npm run check-exercises`
setiap katalog berubah.

## Logika penting

- Tanggal log selalu dari client (tanggal lokal perangkat, `YYYY-MM-DD`) — hindari bug UTC vs WIB.
- Penyimpanan set pakai `upsert` + unique constraint `(user_id, workout_date, exercise_id, set_number)`.
- Auto-fill beban terakhir lewat RPC `get_last_exercise_logs` (memakai `auth.uid()`).
- Timer istirahat & stopwatch berbasis timestamp + Wake Lock; pada iPhone terkunci beep
  tidak berbunyi — status "selesai" tampil saat kembali ke app.
