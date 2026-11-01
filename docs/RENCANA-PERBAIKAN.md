# Rencana Perbaikan Raga Fit

Hasil review kode (1 Nov 2026) + keluhan dari pemakaian langsung.
Urutan = prioritas. Fondasi (Next 16, Supabase SSR, RLS, timer, wake lock) dipertahankan.

## Status (1 Nov 2026)

Selesai dikerjakan:
- [x] Fase 1: Masuk/Daftar terpisah via Server Action, field nama, **konfirmasi password**, error Bahasa Indonesia.
- [x] Fase 1: jadwal fleksibel (pilih hari sendiri, program rotasi A/B/C, bisa latihan hari apa saja).
- [x] Fase 1: beban +/- per 1 kg, angka bisa diketik, pilihan langkah 1 / 2,5 / 5 kg di Profil.
- [x] Fase 2: timer durasi, batal centang menghapus log, zona waktu user, progres tahan refresh, antrean simpan offline.
- [x] Fase 3: dashboard, layar sesi, ringkasan, bottom nav, zoom aktif lagi.
- [x] Fase 4: halaman Riwayat & Profil, generator "Rumah & Gym" + variasi gerakan.
- [x] Fase 5: dokumen & referensi pindah ke `docs/`, CSS landscape jadi varian Tailwind `phone-land:`, test baru.

- [x] `supabase/schema.sql` v2 terpasang di Supabase (data latihan lama di-reset, akun tetap).
- [x] Uji E2E di browser (layar HP, Chrome headless): daftar, onboarding, sesi, ringkasan, riwayat, profil, logout/login.
- [x] Workflow GitHub Supabase keepalive + secret repo.

Belum / ditunda:
- [ ] Lupa password (butuh SMTP).
- [ ] Grafik progres per gerakan, streak.
- [ ] Uji manual di HP (iPhone & Android), terutama landscape dan mode offline.

---

## Fase 1 — Keluhan utama dari pemakaian

### 1.1 Login / Daftar dibangun ulang

Temuan:
- Backend Supabase sehat: konfirmasi email nonaktif, akun tes bisa daftar lalu login ulang via API.
- Alur server sehat: cookie sesi normal maupun token kedaluwarsa tetap bisa masuk (`/dashboard` → `/onboarding`).
- Gejala "daftar bisa, login berikutnya gagal" **belum berhasil direproduksi**. Masalahnya kemungkinan di sisi browser.
  Perlu tahu: pesan error yang muncul, terjadi di HP atau laptop, dan di localhost, Vercel, atau PWA yang di-install.

Yang tetap dikerjakan, karena halamannya memang belum layak:
- Pisah layar **Masuk** dan **Daftar** sesuai referensi `stitch_raga_workout_tracker_ui/masuk_raga` dan `daftar_raga`.
- Proses auth pindah ke **Server Action**, sehingga cookie diset di server lalu `redirect()`. Tidak lagi `router.replace` di client, yang rawan cache router atau sesi tidak sinkron.
- Validasi per field (format email, panjang password, konfirmasi password) dengan pesan di bawah field.
- Semua error Supabase diterjemahkan ke Bahasa Indonesia, termasuk rate limit, error jaringan, dan password lemah.
- Tombol lihat/sembunyi password pakai ikon, loading state, dan cegah submit dobel.
- Field **Nama** saat daftar, supaya sapaannya bukan potongan email.
- Logout via Server Action + `revalidate`, supaya tidak ada halaman lama yang tersangkut.
- (Opsional, perlu SMTP) Lupa password.

### 1.2 Jadwal fleksibel: bisa latihan kapan saja

Temuan:
- Onboarding cuma menanyakan *jumlah* hari. Harinya dipaku di kode: 3x = Sen/Rab/Jum, 4x = Sen/Sel/Kam/Sab ([scheduleGenerator.ts](../src/lib/scheduleGenerator.ts) `ACTIVE_DAYS`). User tidak bisa memilih Sel/Kam/Sab.
- Latihan terikat ke hari. Di hari istirahat tidak ada tombol mulai. Kalau latihan hari lain dikerjakan, status "Selesai" tidak pernah muncul, karena status dihitung dari *tanggal* log, bukan latihan yang dikerjakan.

Rencana:
- Onboarding: user **memilih hari sendiri** (chip Sen–Min). Hari yang dipilih jadi *rencana*, bukan kunci.
- Program jadi **rotasi latihan** (Latihan A, B, C, …), tidak lagi ditempel ke hari.
- Dashboard menampilkan **"Latihan berikutnya"** (urutan rotasi setelah sesi terakhir yang selesai) dan selalu bisa dimulai, hari apa pun.
- Di hari istirahat: "Hari ini jadwal istirahat. Tetap mau latihan?" + tombol mulai.
- User bisa memilih latihan lain dari daftar program.
- Strip minggu: hari rencana (titik oranye), hari yang benar-benar dilatih (centang hijau), hari ini (bingkai).

Perubahan skema (data lama boleh di-reset karena masih MVP):
```
profiles          + planned_days int[]   (mis. {2,4,6})
program_workouts  id, user_id, position, title, exercise_ids text[]   -- ganti user_schedules
workout_sessions  id, user_id, program_workout_id, local_date, started_at, finished_at
workout_logs      + session_id (FK), unique (session_id, exercise_id, set_number)
```

### 1.3 Penambahan beban 1 kg, bukan 0,5 → 1,5 → 2,5

Temuan: [SetRow.tsx](../src/components/SetRow.tsx) memakai langkah 0,5 saat beban 0, lalu 1 setelahnya, sehingga urutannya jadi 0 → 0,5 → 1,5 → 2,5. Angka juga tidak bisa diketik.

Rencana:
- Langkah tetap **1 kg** (0 → 1 → 2 → 3).
- **Tap angka untuk mengetik** (keyboard angka, boleh desimal seperti 12,5) supaya tidak perlu tap 40 kali.
- (Nanti) Pengaturan langkah di Profil: 1 / 2,5 / 5 kg.
- Tombol +/- minimal 48px, sesuai DESIGN.md.

---

## Fase 2 — Bug lain di layar latihan

- **Gerakan durasi**: target stopwatch selalu mulai dari 30 detik (seharusnya `targetSeconds`, mis. 45). Centang tanpa stopwatch tersimpan 1 detik. Stepper DETIK diabaikan.
- **Batal centang** harus menghapus log di DB.
- **Zona waktu**: "hari ini" dihitung di server (UTC di Vercel), sehingga salah antara 00.00–07.00 WIB. Tanggal lokal harus dikirim dari client atau disimpan per user.
- **Progres tidak hilang** saat refresh atau tutup tab: state sesi disimpan di localStorage dan dilanjutkan dari `workout_sessions`.
- **Sinyal buruk**: centang langsung tampil, disimpan di belakang + antrean retry. `userId` dikirim dari server, tidak memanggil `getUser()` setiap centang.
- Layar Selesai: ikon centang yang benar. "Total beban 0 kg" diganti total repetisi untuk latihan tanpa beban. `finished_at` disimpan.

## Fase 3 — UI mengikuti referensi

Acuan utama: `stitch_raga_workout_tracker_ui`. Halaman Riwayat dan Detail Progres diambil dari `stitch_fitrutin_*`.
- Dashboard: kartu besar "Latihan berikutnya" (jumlah gerakan, perkiraan menit, total set, chip gerakan, tombol full-width) + strip minggu.
- Layar latihan: "terakhir: X" di bawah tiap stepper, label "Set 2 AKTIF", kartu gambar besar, gambar gerakan berikutnya dimuat lebih dulu.
- Bottom nav: Jadwal · Riwayat · Profil.
- Zoom diaktifkan lagi (hapus `userScalable: false`). Hari istirahat jangan pakai link `#`.

## Fase 4 — Fitur baru

- **Riwayat**: daftar sesi per minggu/bulan, beban terakhir, rekor pribadi per gerakan.
- **Profil**: ganti nama, ulangi onboarding atau ubah hari/fokus, langkah beban, logout.
- Generator: mode "Keduanya" jangan disamakan dengan "Rumah". Variasi gerakan antar latihan.

## Fase 5 — Rapikan repo

- Masterplan dan folder `stitch_*` dipindah ke `docs/`.
- CSS landscape `!important` di `globals.css` diganti varian Tailwind.
- Test baru: rotasi latihan, langkah beban, tanggal lokal.
