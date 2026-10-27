# Masterplan MVP Lite: Aplikasi Pencatat Latihan untuk Pemula

Versi ringkas dari Masterplan v2. Tujuan: aplikasi yang bisa dipakai nge-gym dalam hitungan minggu, dengan 5 layar, tanpa fitur yang membingungkan pemula. Stack: Next.js (App Router) + Tailwind CSS + Supabase, PWA mobile-first, tema gelap dari desain Stitch ("Raga").

## 1. Prinsip MVP Lite

1. **Satu tujuan:** pilih preferensi sekali → dapat jadwal otomatis → catat set dengan mudah → lihat progres minggu ini.
2. **Satu hal per layar:** pemula tidak perlu melihat RPE, 1RM, atau grafik.
3. **Aman untuk pemula secara default:** jadwal otomatis tidak memilih beban bebas berat.
4. **Semua yang bisa ditunda, ditunda.** Fitur tambahan masuk backlog (bagian 11).

## 2. Cakupan

### Termasuk (5 layar)

| # | Layar | Isi singkat |
| --- | --- | --- |
| 1 | Login / Daftar | Email + password, toggle Masuk/Daftar |
| 2 | Onboarding | 3 pertanyaan (lokasi, hari per minggu, fokus) + ringkasan |
| 3 | Dashboard | Progres minggu ini + daftar Senin–Minggu + tombol Mulai Latihan |
| 4 | Layar Latihan | Satu gerakan per layar (portrait dan landscape): gambar, set KG/Rep, centang, timer istirahat, stopwatch/countdown untuk gerakan durasi |
| 5 | Latihan Selesai | Durasi, total set, total beban |

### Ditunda (tidak dibangun di MVP)

Login Google, pilihan level pemula/menengah, quick switch Rumah/Gym, halaman Workout Preview, ganti gerakan (swap), riwayat dan grafik, rekor pribadi, saran progresi beban, halaman profil lengkap, mode terang, antrean offline penuh, service worker.

Catatan: ikon notifikasi, kutipan motivasi, RPE, estimasi 1RM, dan tombol "Tambah Set" dari desain Stitch **tidak dibuat**.

## 3. Keputusan teknis

| Topik | Keputusan |
| --- | --- |
| Katalog gerakan | Konstanta TypeScript (`src/data/exercises.ts`), tanpa tabel database |
| Gambar | jsDelivr dengan commit SHA terkunci, **wajib diverifikasi** dengan script sebelum dipakai (bagian 9) |
| Tanggal log | Tanggal lokal perangkat (`YYYY-MM-DD`), bukan default database (hindari bug UTC vs WIB) |
| Simpan set | `upsert` langsung ke Supabase dengan unique constraint; bila gagal, tampilkan toast "Gagal menyimpan, coba lagi" dan simpan sementara di state agar tidak hilang |
| Timer istirahat | Berbasis timestamp (`endTime - Date.now()`) + beep + getar + Wake Lock |
| Auth | `@supabase/ssr` + middleware proteksi rute, tanpa konfirmasi email |
| Ikon | Lucide React (bukan font Material Symbols dari Stitch) |
| Tema | Gelap saja |
| Minggu ke-berapa | Dihitung dari tanggal, tanpa kolom counter |

Jujur soal iPhone: saat layar terkunci, JavaScript dibekukan sehingga beep tidak berbunyi. Solusinya Wake Lock (layar tetap menyala selama sesi), dan timer menampilkan status "selesai" saat user kembali ke app.

## 4. Struktur folder

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── onboarding/page.tsx
│   ├── dashboard/page.tsx
│   ├── workout/[day]/page.tsx       # layar latihan + layar selesai (state di halaman yang sama)
│   ├── layout.tsx                    # font, meta PWA, viewport-fit=cover
│   └── manifest.ts
├── components/
│   ├── ExerciseAnimator.tsx          # flip 2 gambar dengan CSS
│   ├── SetRow.tsx                    # KG + Rep/Detik + tombol centang
│   ├── RestTimerBar.tsx, StopwatchControl.tsx
│   └── DayCard.tsx                   # kartu hari di dashboard
├── data/exercises.ts
├── hooks/
│   ├── useRestTimer.ts, useStopwatch.ts
│   └── useWakeLock.ts
├── lib/
│   ├── supabase/{client.ts,server.ts}
│   ├── audio.ts
│   ├── date.ts
│   └── scheduleGenerator.ts
├── middleware.ts                      # bisa bernama proxy.ts di Next.js terbaru
└── scripts/check-exercises.mjs
```

## 5. Supabase

### 5.1 Auth

Authentication → Providers → Email: matikan **Confirm email**. Konsekuensi: tidak ada reset password lewat email. Untuk pemakaian pribadi cukup, untuk publik aktifkan kembali.

### 5.2 Skema SQL (tanpa kolom level dan tanpa counter minggu)

```sql
-- 1. Profil
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Atlet',
  location_mode text not null default 'both'
    check (location_mode in ('home','gym','both')),
  focus_muscle text not null default 'glutes_lower'
    check (focus_muscle in ('glutes_lower','back_chest')),
  days_per_week int not null default 4 check (days_per_week between 3 and 5),
  program_started_on date,
  created_at timestamptz not null default now()
);

-- 2. Jadwal (Senin = 1 ... Minggu = 7)
create table public.user_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  day_title text not null,
  is_rest_day boolean not null default false,
  exercise_ids text[] not null default '{}',
  unique (user_id, day_of_week)
);

-- 3. Log latihan (tanggal selalu dikirim client)
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_date date not null,
  exercise_id text not null,
  set_number int not null check (set_number >= 1),
  weight_kg numeric(5,1) not null default 0 check (weight_kg >= 0), -- 0 = berat badan
  reps_or_seconds int not null check (reps_or_seconds >= 0),
  created_at timestamptz not null default now(),
  constraint uq_log_set unique (user_id, workout_date, exercise_id, set_number)
);

create index idx_workout_logs_memory
  on public.workout_logs (user_id, exercise_id, workout_date desc, set_number asc);
create index idx_workout_logs_date
  on public.workout_logs (user_id, workout_date);

-- 4. RPC beban terakhir per set
create or replace function public.get_last_exercise_logs(p_exercise_ids text[])
returns table (exercise_id text, set_number int, weight_kg numeric, reps_or_seconds int)
language sql stable security invoker
set search_path = public
as $$
  select distinct on (l.exercise_id, l.set_number)
    l.exercise_id, l.set_number, l.weight_kg, l.reps_or_seconds
  from public.workout_logs l
  where l.user_id = auth.uid()
    and l.exercise_id = any(p_exercise_ids)
  order by l.exercise_id, l.set_number, l.workout_date desc, l.created_at desc;
$$;

-- 5. Profil otomatis saat signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'Atlet'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. RLS
alter table public.profiles enable row level security;
alter table public.user_schedules enable row level security;
alter table public.workout_logs enable row level security;

create policy "profil sendiri" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "jadwal sendiri" on public.user_schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "log sendiri" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 5.3 Query yang dipakai

- **Simpan set:** `upsert(row, { onConflict: 'user_id,workout_date,exercise_id,set_number' })`.
- **Auto-fill:** `supabase.rpc('get_last_exercise_logs', { p_exercise_ids })` sekali saat layar latihan dibuka.
- **Progres minggu ini:** ambil `distinct workout_date` antara Senin dan Minggu minggu berjalan, lalu cocokkan dengan `day_of_week` di jadwal.
- **Selesai Latihan:** total set dan total beban dihitung dari log hari itu (jumlah baris; jumlah `weight_kg * reps_or_seconds` untuk gerakan `reps`).

## 6. Helper tanggal (`lib/date.ts`)

`Date.getDay()` memakai Minggu = 0, sedangkan skema memakai Senin = 1 sampai Minggu = 7.

```ts
export function todayLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toDayOfWeek(d = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

export function weekRange(d = new Date()): { monday: string; sunday: string } {
  const monday = new Date(d);
  monday.setDate(d.getDate() - (toDayOfWeek(d) - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday: todayLocal(monday), sunday: todayLocal(sunday) };
}
```

## 7. Katalog gerakan (81 gerakan, model disederhanakan)

Katalog 81 gerakan dari plan awal dipakai, dengan tipe data berikut dan koreksi di bawahnya.

```ts
export interface Exercise {
  id: string;              // nama folder di free-exercise-db; JANGAN diganti setelah ada log
  name: string;
  muscleGroup: MuscleGroup;
  location: LocationMode;  // 'both' = rumah & gym, 'gym' = khusus gym
  equipment: string;
  metric: "reps" | "duration";
  sets: number;
  target: string;          // label tampilan, mis. "10-12" atau "30-45 dtk"
  defaultValue: number;    // nilai awal input bila belum ada riwayat (mis. 10 atau 30)
  restSeconds: number;
  tips: string;
  autoPick: boolean;       // false = tidak dipilih generator otomatis
}

export const exerciseMap = new Map(EXERCISES.map((e) => [e.id, e]));
export const getExercise = (id: string) => exerciseMap.get(id) ?? null; // selalu cek null
```

### Koreksi isi katalog

| ID | Masalah | Tindakan |
| --- | --- | --- |
| `Pullups` | Dilabeli mesin assisted, gambar pull-up biasa | Ganti nama "Pull-Up", `autoPick: false` |
| `Cable_Hammer_Curls_-_Rope_Attachment` | Dilabeli "Rope Cable Bicep Curl" | Ganti nama "Cable Hammer Curl (Rope)", perbaiki tips |
| `Air_Bike` | Dilabeli "Bicycle Crunch" | Cek gambar lewat script; ganti ID bila tidak cocok |
| `Upright_Barbell_Row` | Kurang ramah bahu pemula | `autoPick: false` |
| `Freehand_Jump_Squat` | Berdampak tinggi pada lutut | Ganti nama "Bodyweight Squat", tips tanpa lompat, `autoPick: true` |
| `Barbell_Full_Squat`, `Barbell_Glute_Bridge`, `Romanian_Deadlift`, `Bent_Over_Barbell_Row`, `Barbell_Bench_Press_-_Medium_Grip`, `Standing_Military_Press`, `T-Bar_Row_with_Handle`, `Barbell_Walking_Lunge` | Beban bebas berat untuk pemula | `autoPick: false` (tetap ada di katalog untuk fase swap) |

Aturan: jangan ubah `id` yang sudah dipakai; hanya `name`, `tips`, `autoPick`. Jika perlu menghapus gerakan, jangan dihapus dari katalog (riwayat log akan rusak); tandai tidak aktif.

## 8. Generator jadwal

### Pola hari (3–5 hari)

| Hari/minggu | Hari aktif |
| --- | --- |
| 3 | Senin, Rabu, Jumat |
| 4 | Senin, Selasa, Kamis, Sabtu |
| 5 | Senin, Selasa, Rabu, Jumat, Sabtu |

Pola 4 hari menghindari dua hari kaki berturut-turut. Pola 5 hari memakai urutan template selang-seling bawah/atas.

### Kode

```ts
import { EXERCISES, type MuscleGroup, type LocationMode } from "@/data/exercises";

type Slot = [MuscleGroup, number];
interface DayBlueprint { title: string; groups: Slot[] }

const GLUTES_LOWER: DayBlueprint[] = [
  { title: "Fokus Bokong & Paha Belakang", groups: [["glutes_hamstrings", 4], ["quads_calves", 1], ["core", 1]] },
  { title: "Upper Body: Punggung & Dada",   groups: [["back", 2], ["chest", 2], ["shoulders", 1], ["arms", 1]] },
  { title: "Bokong, Paha Depan & Perut",    groups: [["glutes_hamstrings", 2], ["quads_calves", 3], ["core", 1]] },
  { title: "Bokong & Upper Ringan",         groups: [["glutes_hamstrings", 3], ["back", 1], ["shoulders", 1], ["core", 1]] },
  { title: "Full Body & Core",              groups: [["glutes_hamstrings", 2], ["quads_calves", 1], ["back", 1], ["core", 2]] },
];

const BACK_CHEST: DayBlueprint[] = [
  { title: "Fokus Punggung & Postur",       groups: [["back", 3], ["shoulders", 2], ["arms", 1]] },
  { title: "Kaki, Bokong & Perut",          groups: [["glutes_hamstrings", 2], ["quads_calves", 2], ["core", 2]] },
  { title: "Dada, Punggung & Lengan",       groups: [["chest", 3], ["back", 2], ["arms", 1]] },
  { title: "Upper Body & Core",             groups: [["back", 2], ["chest", 2], ["shoulders", 1], ["core", 1]] },
  { title: "Lower Body & Core",             groups: [["glutes_hamstrings", 3], ["quads_calves", 2], ["core", 1]] },
];

const ACTIVE_DAYS: Record<number, number[]> = {
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
};

// Mode gym: dahulukan gerakan khusus gym. Hasil selalu stabil (tanpa random).
const rank = (loc: string, mode: LocationMode) => (mode === "gym" && loc === "gym" ? 0 : 1);

export function generateWeeklySchedule(
  userId: string,
  locationMode: LocationMode,
  focusMuscle: string,
  daysPerWeek: number
) {
  const templates = focusMuscle === "back_chest" ? BACK_CHEST : GLUTES_LOWER;
  const activeDays = ACTIVE_DAYS[daysPerWeek] ?? ACTIVE_DAYS[4];

  const pool = EXERCISES.filter(
    (e) => e.autoPick && !(locationMode === "home" && e.location === "gym")
  );

  let idx = 0;
  return [1, 2, 3, 4, 5, 6, 7].map((day) => {
    if (!activeDays.includes(day)) {
      return { user_id: userId, day_of_week: day, day_title: "Istirahat", is_rest_day: true, exercise_ids: [] as string[] };
    }
    const bp = templates[idx++ % templates.length];
    const used = new Set<string>();
    const ids: string[] = [];
    for (const [group, count] of bp.groups) {
      const picks = pool
        .filter((e) => e.muscleGroup === group && !used.has(e.id))
        .sort((a, b) => rank(a.location, locationMode) - rank(b.location, locationMode))
        .slice(0, count);
      picks.forEach((e) => { used.add(e.id); ids.push(e.id); });
    }
    return { user_id: userId, day_of_week: day, day_title: bp.title, is_rest_day: false, exercise_ids: ids };
  });
}
```

Simpan hasilnya dengan `upsert` pada `(user_id, day_of_week)` supaya menyusun ulang jadwal tidak menggandakan baris. Isi juga `profiles.program_started_on` dengan `todayLocal()`.

**Cek setelah `autoPick` diterapkan:** mode `home` harus tetap menghasilkan gerakan yang cukup di setiap grup otot. Ini diuji lewat unit test (bagian 10).

## 9. Spesifikasi layar

Desain acuan: file Stitch "Raga". Ambil warna, font, dan komponen dari sana; abaikan elemen yang ada di daftar "Ditunda".

### 9.1 Design tokens

Ambil nilai hex persis dari panel design system Stitch (Primary, Secondary, Tertiary, Neutral) dan masukkan ke `tailwind.config`:

```ts
theme: {
  extend: {
    colors: {
      brand: { DEFAULT: "#<primary-dari-stitch>" },   // oranye-coral
      done:  { DEFAULT: "#<secondary-dari-stitch>" }, // hijau selesai
      surface: { 0: "#<netral-gelap>", 1: "#<netral-kartu>" },
    },
    fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
    borderRadius: { card: "1.25rem" },
  },
}
```

Font: Plus Jakarta Sans via `next/font/google`. Ukuran minimum: body 14 px, label 12 px, angka KG/Rep/timer besar (24 px ke atas). Target sentuh minimal 48 px.

### 9.2 Login / Daftar

- Logo + tagline "Catat latihanmu, lihat progresmu."
- Toggle "Masuk | Daftar", field Email dan Password (tombol lihat/sembunyi), satu tombol utama.
- Pesan error inline ("Email atau password salah").
- Setelah daftar: langsung ke onboarding. Setelah masuk: ke dashboard bila `program_started_on` terisi, selain itu ke onboarding.
- **Tidak ada:** Google login, link "Lupa password" (belum ada alurnya).

### 9.3 Onboarding (3 langkah + ringkasan)

1. "Di mana kamu biasa latihan?" → Rumah / Gym / Keduanya.
2. "Berapa hari seminggu?" → 3 / 4 / 5, dengan pratinjau hari aktif.
3. "Apa fokusmu?" → Bokong & Kaki / Punggung & Dada.
4. Ringkasan pilihan + pratinjau jadwal 7 hari + tombol "Mulai Program".

Saat tombol ditekan: panggil `generateWeeklySchedule`, `upsert` profil dan jadwal, lalu arahkan ke dashboard.

### 9.4 Dashboard

- Sapaan "Halo, \[nama\]" + tanggal hari ini.
- Kartu progres: "Minggu ini: X dari Y latihan selesai" + bar progres.
- 7 kartu Senin–Minggu. Hari latihan: chip hari, judul, "N gerakan", status (Belum / Selesai dengan centang hijau / Terlewat). Hari istirahat: kartu redup "Istirahat".
- Kartu hari ini menonjol (border aksen) dengan tombol "Mulai Latihan".
- Hari latihan lain bisa dibuka bila user ingin latihan di hari berbeda.
- Tombol keluar (ikon kecil di header).
- **Tidak ada:** quick switch lokasi, gambar besar di kartu, tag otot, kutipan, statistik tambahan, bottom navigation.

### 9.5 Layar Latihan

Satu gerakan per layar.

- Atas: tombol kembali, "Gerakan 2 dari 6", bar progres tipis.
- Gambar gerakan (tinggi sekitar 210 px, `ExerciseAnimator`), nama, label alat, target ("3 x 10-12" atau "3 x 30-45 dtk"), tips 2 baris yang bisa dibuka penuh.
- Daftar set (sesuai `sets`): tiap baris berisi "Set N", input KG dengan tombol -/+, input Rep atau Detik dengan tombol -/+ (gerakan durasi memakai stopwatch, lihat 9.7), tombol centang bulat. Petunjuk abu-abu "terakhir: 12,5 kg x 10" dari RPC. Untuk bodyweight, KG default 0 dengan label "0 = berat badan".
- Status set: belum, aktif, selesai (hijau, tetap bisa diketuk untuk diedit).
- Saat tombol centang ditekan: simpan (upsert), mulai timer istirahat, pindah fokus ke set berikutnya. `unlockAudio()` dipanggil pada tap pertama.
- Timer istirahat: bar kecil di bawah (di atas safe area): hitung mundur, "+15 dtk", "Lewati". Selesai: beep + getar + bar berubah hijau.
- Tombol bawah: "Gerakan Berikutnya"; di gerakan terakhir "Selesai".
- Layar tetap menyala selama sesi (Wake Lock).
- **Tidak ada:** RPE, 1RM, Tambah Set, Ganti Gerakan.

### 9.6 Latihan Selesai

Ikon centang besar, "Latihan selesai!", tiga angka (durasi, total set, total beban), tombol "Kembali ke Jadwal". Durasi dihitung dari waktu masuk layar latihan sampai tombol Selesai.

### 9.7 Stopwatch / countdown untuk gerakan durasi

Berlaku untuk gerakan dengan `metric: "duration"` (Plank, Mountain Climbers, Dead Bug). Tambahkan field `targetSeconds` (batas atas target, mis. 45) pada gerakan tersebut di katalog.

- Di baris set aktif, kolom Detik diganti kontrol besar: angka "00:30", tombol **Mulai** / **Jeda**, dan **Reset**.
- Mode **countdown**: hitung mundur dari `targetSeconds`. Selesai: beep + getar, dan detik terpakai terisi otomatis di kolom Detik.
- Tombol **Selesai lebih awal** menghentikan hitungan dan mengisi detik yang sudah berjalan.
- Tombol -5 / +5 tetap ada untuk koreksi manual sebelum tombol centang ditekan.
- Setelah tombol centang ditekan, set disimpan dan timer istirahat berjalan seperti gerakan biasa.
- Berbasis timestamp, sama seperti timer istirahat, sehingga tetap akurat setelah pindah aplikasi sebentar.

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { playTimerFinishBeep } from "@/lib/audio";

export function useStopwatch(targetSeconds: number) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null); // timestamp mulai
  const baseRef = useRef(0);                    // detik terkumpul sebelum jeda

  const read = () =>
    baseRef.current + (startRef.current ? (Date.now() - startRef.current) / 1000 : 0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const e = Math.floor(read());
      setElapsed(e);
      if (e >= targetSeconds) {
        baseRef.current = targetSeconds;
        startRef.current = null;
        setRunning(false);
        setElapsed(targetSeconds);
        playTimerFinishBeep();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, targetSeconds]);

  const start = useCallback(() => { startRef.current = Date.now(); setRunning(true); }, []);
  const pause = useCallback(() => {
    baseRef.current = read(); startRef.current = null; setRunning(false);
  }, []);
  const reset = useCallback(() => {
    baseRef.current = 0; startRef.current = null; setRunning(false); setElapsed(0);
  }, []);

  return { elapsed, remaining: Math.max(0, targetSeconds - elapsed), running, start, pause, reset };
}
```

### 9.8 Layout landscape (ponsel)

Tujuan: ponsel disandarkan ke botol atau lantai tetap nyaman dipakai, tanpa scroll panjang.

- **Aktif hanya di ponsel landscape**, bukan di tablet atau desktop, memakai custom variant berbasis tinggi layar: `(orientation: landscape) and (max-height: 500px)`.
- Tailwind v3: tambahkan di `theme.extend.screens` entri `land: { raw: "(orientation: landscape) and (max-height: 500px)" }`. Tailwind v4: `@custom-variant land (@media (orientation: landscape) and (max-height: 500px));`. Pakai sebagai `land:grid`, `land:grid-cols-12`, dst.
- Wrapper: `grid grid-cols-12 h-dvh overflow-hidden` pada varian landscape; portrait tetap `flex flex-col min-h-dvh`.
- **Kolom kiri (`col-span-5`):** gambar gerakan besar, nama gerakan, satu baris tips, dan tips lain dibuka lewat ketukan.
- **Kolom kanan (`col-span-7`, `overflow-y-auto`):** pill stepper nomor gerakan (1 2 3 4 5 6) di atas, lalu daftar set dengan stepper KG/Rep dan tombol centang besar. Untuk gerakan durasi, kontrol stopwatch muncul di baris set aktif.
- **Timer istirahat:** bar di dasar kolom kanan, bukan di bawah seluruh layar.
- Tombol "Gerakan Berikutnya" / "Selesai" menempel di bawah kolom kanan.
- Safe area kiri dan kanan dipertahankan (`env(safe-area-inset-left/right)`) agar konten tidak tertutup notch saat landscape.
- Rotasi di tengah sesi tidak boleh menghapus input: state set disimpan di komponen induk, bukan di komponen layout.
- Cek manual: putar layar saat set sedang diisi dan saat timer berjalan; angka dan sisa waktu harus tetap benar.

## 10. Komponen inti

### 10.1 Animasi gambar (`ExerciseAnimator`)

Dua gambar bertumpuk dengan animasi CSS (tanpa re-render React). Berhenti di luar layar lewat `IntersectionObserver`, dan hormati `prefers-reduced-motion`. Beri fallback bila gambar gagal dimuat.

```css
.frame { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.frame-a { animation: flipA 1.8s steps(1, end) infinite; }
.frame-b { animation: flipB 1.8s steps(1, end) infinite; }
@keyframes flipA { 0%{opacity:1} 50%{opacity:0} }
@keyframes flipB { 0%{opacity:0} 50%{opacity:1} }
.animator[data-paused="true"] .frame { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .frame { animation:none } .frame-b { opacity:0 } }
```

### 10.2 Timer istirahat (`useRestTimer`)

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { playTimerFinishBeep } from "@/lib/audio";

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0);
  const endRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const tick = useCallback(() => {
    if (endRef.current == null) return;
    const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left === 0 && !firedRef.current) {
      firedRef.current = true;
      endRef.current = null;
      playTimerFinishBeep();
    }
  }, []);

  useEffect(() => {
    const id = setInterval(tick, 250);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [tick]);

  const start = useCallback((s: number) => { endRef.current = Date.now() + s * 1000; firedRef.current = false; setRemaining(s); }, []);
  const add = useCallback((s: number) => { if (endRef.current) endRef.current += s * 1000; tick(); }, [tick]);
  const stop = useCallback(() => { endRef.current = null; setRemaining(0); }, []);
  return { remaining, start, add, stop };
}
```

### 10.3 Audio dan Wake Lock

- `lib/audio.ts`: `unlockAudio()` membuat dan me-resume `AudioContext` di dalam handler tap; `playTimerFinishBeep()` memainkan dua nada singkat dan `navigator.vibrate?.([200,100,200])`. Saat `visibilitychange` ke visible, panggil `audioCtx.resume()` lagi (iOS bisa menaruh context di state suspended/interrupted).
- `useWakeLock(active)`: `navigator.wakeLock.request("screen")`, diminta ulang saat tab kembali visible, dilepas saat unmount. Dibungkus try/catch karena bisa ditolak.

### 10.4 Auth dan routing

- `lib/supabase/client.ts` (`createBrowserClient`) dan `server.ts` (`createServerClient` dengan cookies).
- `middleware.ts`: segarkan sesi; redirect ke `/login` untuk `/dashboard`, `/workout/*`, `/onboarding` bila belum login; redirect ke `/dashboard` bila sudah login membuka `/login`.
- Halaman interaktif memakai `"use client"`.

### 10.5 PWA minimal

`manifest.ts` (nama, `display: "standalone"`, ikon 192 dan 512), `apple-touch-icon` 180 px, `viewport-fit=cover`, padding `env(safe-area-inset-bottom)` untuk tombol dan timer bawah, unit `dvh` untuk tinggi layar.

## 11. Pengujian

### 11.1 Script validasi katalog

`scripts/check-exercises.mjs`: untuk setiap `id` di katalog, kirim `HEAD` ke `${CDN}/${id}/0.jpg` dan `1.jpg`, laporkan yang bukan 200. Jalankan **sebelum** membangun UI. Ini sekaligus membuktikan bahwa commit SHA dan struktur path (`exercises/<id>/0.jpg` atau `exercises/<id>/images/0.jpg`) benar. Jika SHA/path salah, perbaiki konstanta `CDN_BASE`.

### 11.2 Unit test (Vitest)

- `todayLocal`, `toDayOfWeek`, `weekRange` (Senin, Minggu, pergantian bulan/tahun).
- `generateWeeklySchedule` untuk semua kombinasi (home/gym/both × 2 fokus × 3/4/5 hari): jumlah gerakan sesuai template, tanpa duplikat, tidak ada gerakan gym di mode home, tidak ada `autoPick: false`.

### 11.3 Uji manual di perangkat

| Skenario | Yang dicek |
| --- | --- |
| iPhone Safari | Beep berbunyi setelah tap pertama, layar tetap menyala, tombol bawah tidak tertutup home indicator |
| Android Chrome | Getar, layar menyala, Add to Home Screen |
| Latihan jam 05.00 WIB | Log bertanggal hari yang benar |
| Centang, batalkan, centang ulang | Tidak ada baris ganda di database |
| Pindah aplikasi 30 detik saat timer | Sisa waktu benar saat kembali |
| Sinyal putus saat centang set | Toast error, data tidak hilang dari layar |
| ID gerakan tidak dikenal | Fallback tampil, app tidak crash |
| Dua akun berbeda | Akun A tidak bisa membaca data akun B (RLS) |

### 11.4 Keamanan

RLS aktif di tiga tabel, `service_role` key tidak pernah ada di client, hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di browser.

## 12. Roadmap

Estimasi untuk satu developer yang sudah familiar dengan Next.js dan Supabase; sesuaikan dengan pengalamanmu.

| Fase | Isi | Estimasi |
| --- | --- | --- |
| 1. Fondasi | Project Next.js, Tailwind + tokens Stitch, font, `@supabase/ssr`, skema SQL, RLS, trigger, middleware, layar Login | 1–2 hari |
| 2. Data & jadwal | Katalog dengan koreksi, script validasi gambar, `date.ts`, `scheduleGenerator`, unit test, Onboarding | 2 hari |
| 3. Dashboard & latihan | Dashboard + progres mingguan, layar latihan, SetRow, auto-fill RPC, upsert log, timer, audio, Wake Lock, animasi gambar, stopwatch durasi, layout landscape | 4–5 hari |
| 4. Penutup & rilis | Layar Latihan Selesai, PWA minimal, uji di perangkat nyata, deploy (Vercel) | 1–2 hari |

**Definisi selesai MVP:** user bisa daftar, memilih 3 preferensi, melihat jadwal, mencatat satu sesi penuh dengan beban terisi otomatis dari sesi sebelumnya, melihat ringkasan, dan progres minggu ini muncul benar dengan tanggal WIB.

## 13. Backlog setelah MVP (urut prioritas)

1. Ganti gerakan (swap) — hanya hari ini, lalu opsi permanen.
2. Riwayat sederhana (daftar sesi per tanggal), lalu grafik beban per gerakan.
3. Antrean log offline + indikator sinkron + service worker untuk gambar.
4. Saran progresi beban (naik bila semua set mencapai batas atas rep).
5. Halaman profil: susun ulang jadwal, ganti password, ubah preferensi.
6. Pilihan level pemula/menengah (membuka gerakan `autoPick: false`).
7. Mode terang, login Google, reset password via email.

## 14. Risiko

| Risiko | Mitigasi |
| --- | --- |
| SHA atau path gambar salah | Script validasi sebelum membangun UI |
| ID gerakan berubah | Aturan katalog + fallback UI |
| Beep tak berbunyi saat layar terkunci di iPhone | Wake Lock + status selesai saat kembali; beri tahu user |
| Sinyal gym lemah | Toast error + data tetap di layar; antrean offline masuk backlog |
| Lupa password (tanpa konfirmasi email) | Terima risikonya untuk pemakaian pribadi; aktifkan email auth bila publik |
| Scope membengkak | Patuhi daftar "Ditunda"; tambah fitur hanya setelah MVP dipakai |

## 15. Langkah berikutnya

1. Jalankan SQL bagian 5.2 di Supabase.
2. Buat dan jalankan `scripts/check-exercises.mjs` untuk 81 ID.
3. Terapkan koreksi katalog (bagian 7) dan token warna dari Stitch (bagian 9.1).
4. Bangun `date.ts` dan `scheduleGenerator.ts` beserta test.
5. Lanjut Login → Onboarding → Dashboard → Layar Latihan → Latihan Selesai.
