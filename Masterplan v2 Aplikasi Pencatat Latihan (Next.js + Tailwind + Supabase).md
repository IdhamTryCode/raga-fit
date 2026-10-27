# Masterplan v2: Aplikasi Pencatat Latihan

Revisi lengkap dari plan awal. Stack: Next.js (App Router) + Tailwind CSS + Supabase, PWA mobile-first. Semua bug dan klaim berlebihan dari v1 sudah dikoreksi, dan bagian yang sebelumnya kurang (offline, auth guard, progres, pengujian) sudah ditambahkan.

## 1. Ringkasan perubahan dari v1

| Area | Masalah di v1 | Perbaikan di v2 |
| --- | --- | --- |
| Tanggal log | `CURRENT_DATE` memakai UTC, latihan pagi WIB tercatat kemarin | Tanggal lokal dikirim dari client (`YYYY-MM-DD`), kolom tanpa default |
| Duplikasi log | Tidak ada unique constraint, set bisa terdobel | `UNIQUE (user_id, workout_date, exercise_id, set_number)` + upsert |
| RPC | Menerima `p_user_id` dari client | Memakai `auth.uid()`, `search_path` dikunci |
| Profil | Dibuat manual saat onboarding | Trigger otomatis saat signup |
| Fokus otot | DB mengizinkan 4 nilai, template hanya 2 | DB dan template disamakan (2 fokus di MVP) |
| Hari latihan | 4 hari: Jumat–Sabtu sama-sama hari kaki | Pola hari dan urutan template disusun ulang |
| Sort generator | Comparator tidak valid dan tidak deterministik | Skor eksplisit + rotasi mingguan |
| Timer | Klaim "anti-mati saat lock screen" | Timestamp + Wake Lock + penanganan resume, ekspektasi iOS dijelaskan jujur |
| Offline | Klaim jalan tanpa sinyal, padahal log butuh jaringan | Antrean log lokal (IndexedDB) + sinkron otomatis |
| Auth | Hanya client browser | `@supabase/ssr` + middleware proteksi rute |
| Katalog | Nama tidak cocok dengan ID, target berupa string | Metadata terstruktur, validasi otomatis lewat script |
| `current_week` | Kolom tanpa fungsi | Dihapus, minggu dihitung dari `program_started_on` |
| Estimasi waktu | 15–60 menit per tugas | Roadmap per fase dalam hari |

## 2. Scope

**MVP (Fase 1–3):** login, onboarding, jadwal otomatis, dashboard mingguan, layar latihan aktif (catat set, auto-fill beban terakhir, timer istirahat).

**Fase lanjut (Fase 4–6):** swap gerakan, animasi gerakan, offline queue, layout landscape, PWA terpasang, progresi beban.

Prinsip: rilis versi yang bisa dipakai nge-gym dulu, lalu tambah fitur satu per satu. Jangan bangun semuanya sekaligus.

## 3. Keputusan arsitektur

1. **Katalog gerakan statis di codebase** (`src/data/exercises.ts`). Tidak ada tabel `exercises`. Konsekuensi yang harus dijaga: ID gerakan **tidak boleh diganti nama** setelah ada log, dan UI wajib punya fallback untuk ID yang tidak dikenal (jangan crash).
2. **Gambar dari jsDelivr dengan commit SHA terkunci.** SHA dan struktur path (`exercises/<id>/0.jpg` atau `exercises/<id>/images/0.jpg`) **harus diverifikasi** dengan script (bagian 12) sebelum dipakai. Jangan dianggap benar sebelum lolos script.
3. **Log ditulis lokal dulu, lalu disinkron** ke Supabase (offline-first ringan).
4. **Minggu dihitung dari tanggal**, bukan kolom counter.
5. **Semua tanggal latihan memakai tanggal lokal perangkat** (format `YYYY-MM-DD`).
6. **Metrik input:** `reps` (KG + Rep) dan `duration` (KG + Detik, dengan stopwatch/countdown bawaan).
7. **Penjelasan jujur soal iOS:** layar terkunci = JavaScript dibekukan. Solusinya menjaga layar tetap menyala (Wake Lock), bukan berharap beep berbunyi di background.

## 4. Struktur folder

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── onboarding/page.tsx
│   ├── dashboard/page.tsx
│   ├── workout/[day]/page.tsx
│   ├── layout.tsx                 # meta PWA, viewport-fit=cover
│   └── manifest.ts
├── components/
│   ├── ExerciseAnimator.tsx       # flip CSS, pause saat tak terlihat
│   ├── ActiveExerciseCard.tsx     # input set, auto-fill, stopwatch utk duration
│   ├── RestTimerBar.tsx
│   ├── SwapExerciseSheet.tsx
│   └── SyncStatusBadge.tsx        # indikator "tersimpan / menunggu sinkron"
├── data/
│   └── exercises.ts
├── hooks/
│   ├── useRestTimer.ts
│   ├── useWakeLock.ts
│   └── useOnlineStatus.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # createBrowserClient
│   │   └── server.ts              # createServerClient (cookies)
│   ├── audio.ts
│   ├── date.ts                    # todayLocal(), weekRange(), toDayOfWeek()
│   ├── logQueue.ts                # antrean IndexedDB + flush
│   └── scheduleGenerator.ts
├── middleware.ts                  # redirect jika belum login
└── scripts/
    └── check-exercises.mjs        # validasi ID + gambar (dijalankan manual/CI)
```

Catatan: pada Next.js versi terbaru, file `middleware.ts` bisa bernama `proxy.ts`. Ikuti dokumentasi versi yang terpasang.

## 5. Supabase

### 5.1 Konfigurasi Auth

- Authentication → Providers → Email: matikan **Confirm email** bila ini aplikasi pribadi/kecil.
- Konsekuensi: tidak ada reset password lewat email yang andal. Siapkan halaman "ganti password" saat login, atau terima risiko ini untuk pemakaian pribadi.
- Gunakan paket `@supabase/ssr` (bukan `auth-helpers`, yang sudah ditinggalkan).

### 5.2 Skema SQL (revisi)

```sql
-- 1. Profil
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Atlet',
  location_mode text not null default 'both'
    check (location_mode in ('home','gym','both')),
  focus_muscle text not null default 'glutes_lower'
    check (focus_muscle in ('glutes_lower','back_chest')),
  days_per_week int not null default 4
    check (days_per_week between 2 and 5),
  experience text not null default 'beginner'
    check (experience in ('beginner','intermediate')),
  program_started_on date,
  created_at timestamptz not null default now()
);

-- 2. Jadwal mingguan (Senin = 1 ... Minggu = 7)
create table public.user_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  day_title text not null,
  is_rest_day boolean not null default false,
  exercise_ids text[] not null default '{}',
  unique (user_id, day_of_week)
);

-- 3. Log latihan (tanggal SELALU dikirim client, tanpa default)
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

-- 4. Index untuk "last weight memory"
create index idx_workout_logs_memory
  on public.workout_logs (user_id, exercise_id, workout_date desc, set_number asc);

-- 5. Index untuk query progres mingguan
create index idx_workout_logs_date
  on public.workout_logs (user_id, workout_date);

-- 6. RPC: beban terakhir per set (memakai auth.uid())
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

-- 7. Trigger: profil dibuat otomatis saat signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
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

-- 8. RLS
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

### 5.3 Query penting

- **Progres minggu ini:** `select distinct workout_date from workout_logs where user_id = auth.uid() and workout_date between :senin and :minggu`. Tanggal batas dihitung di client memakai `lib/date.ts`.
- **Auto-fill:** `supabase.rpc('get_last_exercise_logs', { p_exercise_ids: ids })`, hasilnya di-cache di memori selama sesi latihan.
- **Simpan set:** `upsert(rows, { onConflict: 'user_id,workout_date,exercise_id,set_number' })`.

### 5.4 Helper tanggal (`lib/date.ts`)

Perhatikan perbedaan `Date.getDay()` (Minggu = 0) dengan skema (Senin = 1 … Minggu = 7).

```ts
export function todayLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 1 = Senin ... 7 = Minggu
export function toDayOfWeek(d = new Date()): number {
  const js = d.getDay(); // 0 = Minggu
  return js === 0 ? 7 : js;
}

export function weekRange(d = new Date()): { monday: string; sunday: string } {
  const dow = toDayOfWeek(d);
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday: todayLocal(monday), sunday: todayLocal(sunday) };
}
```

## 6. Katalog gerakan (81 gerakan, struktur diperbarui)

Katalog 81 gerakan dari v1 tetap dipakai, dengan perubahan model data dan koreksi berikut.

### 6.1 Tipe data baru

```ts
export type LoadType = "weight" | "bodyweight" | "assist";
export type Level = "beginner" | "intermediate";

export interface Exercise {
  id: string;              // nama folder di free-exercise-db, JANGAN diganti setelah ada log
  name: string;
  muscleGroup: MuscleGroup;
  location: LocationMode;
  equipment: string;
  metric: ExerciseMetric;  // 'reps' | 'duration'
  loadType: LoadType;      // 'assist' = angka besar berarti lebih ringan
  level: Level;            // dipakai generator untuk menyaring
  sets: number;
  min: number;             // batas bawah rep atau detik
  max: number;             // batas atas rep atau detik
  perSide: boolean;        // true = target dihitung per sisi
  restSeconds: number;
  tips: string;
  caution?: string;        // catatan keamanan singkat (opsional)
}

export const exerciseMap = new Map(EXERCISES.map((e) => [e.id, e]));
export const getExercise = (id: string) => exerciseMap.get(id) ?? null; // wajib dicek null
```

Label target untuk UI dibentuk dari data (`"10-12 /sisi"`, `"30-45 dtk"`), bukan disimpan sebagai string. Dengan begitu auto-fill, perbandingan dengan sesi lalu, dan progresi bisa diproses.

### 6.2 Koreksi isi katalog

| ID | Masalah | Tindakan |
| --- | --- | --- |
| `Pullups` | Dilabeli "Assisted Pull-Up Machine" tapi gambarnya pull-up biasa | Cari ID yang cocok untuk mesin assisted. Jika tidak ada, ganti nama jadi "Pull-Up (dibantu mesin)" dengan `loadType: "assist"` atau hapus |
| `Cable_Hammer_Curls_-_Rope_Attachment` | Dilabeli "Rope Cable Bicep Curl" tapi itu hammer curl | Ganti nama jadi "Cable Hammer Curl (Rope)" dan perbaiki tips (genggaman netral) |
| `Air_Bike` | Dilabeli "Bicycle Crunch" | Cek gambarnya di script; jika tidak cocok, cari ID lain |
| `Upright_Barbell_Row` | Sering membuat bahu tidak nyaman bagi pemula | `level: "intermediate"` + `caution` |
| `Freehand_Jump_Squat` | Berdampak tinggi pada lutut | Pisahkan: squat biasa untuk pemula, jump squat sebagai variasi `intermediate` |
| `Barbell_Full_Squat`, `Barbell_Glute_Bridge`, `Barbell_Bench_Press_-_Medium_Grip`, `Romanian_Deadlift`, `Bent_Over_Barbell_Row`, `Standing_Military_Press` | Beban bebas berat, risiko bagi pemula tanpa pengawasan | `level: "intermediate"` + `caution: "Mulai dengan bar kosong, minta spotter"` |

### 6.3 Aturan menjaga katalog

- Jangan ubah `id` yang sudah dipakai. Ubah hanya `name`, `tips`, `caution`.
- Menghapus gerakan: tandai `deprecated: true`, jangan dihapus, supaya riwayat log tetap bisa dirender.
- Jalankan `scripts/check-exercises.mjs` setiap kali katalog diubah.

## 7. Generator jadwal (revisi)

### 7.1 Pola hari

| Hari/minggu | Hari aktif | Catatan |
| --- | --- | --- |
| 2 | Senin, Kamis |  |
| 3 | Senin, Rabu, Jumat |  |
| 4 | Senin, Selasa, Kamis, Sabtu | Tidak ada dua hari kaki berturut-turut |
| 5 | Senin, Selasa, Rabu, Jumat, Sabtu | Urutan template selang-seling bawah/atas |

Opsi 6 hari dihapus dari MVP (templatenya hanya 5 dan hari istirahat berkurang). Bila nanti dibutuhkan, buat template ke-6 yang berbeda.

### 7.2 Urutan template

- `glutes_lower`: Bokong A → Upper (postur) → Kaki depan + bokong → Bokong B + upper ringan → Full body + core.
- `back_chest`: Punggung → Kaki/bokong/core → Dada + punggung → Upper sculpt → Lower balance.

Cek: gerakan kaki tidak boleh berada di dua hari berturut-turut pada pola 4 dan 5 hari.

### 7.3 Kode

```ts
import { EXERCISES, type Exercise, type MuscleGroup, type LocationMode } from "@/data/exercises";

interface DayBlueprint {
  title: string;
  groups: { group: MuscleGroup; count: number }[];
}

export const FOCUS_TEMPLATES: Record<"glutes_lower" | "back_chest", DayBlueprint[]> = {
  glutes_lower: [/* sama seperti v1, urutan sesuai bagian 7.2 */],
  back_chest: [/* sama seperti v1 */],
};

const ACTIVE_DAYS_MAP: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
};

type Experience = "beginner" | "intermediate";

// Gerakan gym diprioritaskan hanya bila mode 'gym'. Pemula tidak diberi beban bebas berat.
const rank = (e: Exercise, mode: LocationMode) => (mode === "gym" && e.location === "gym" ? 0 : 1);

// Rotasi deterministik: variasi tiap minggu tanpa random
function pick<T>(list: T[], count: number, offset: number): T[] {
  if (list.length === 0) return [];
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, list.length); i++) {
    out.push(list[(offset + i) % list.length]);
  }
  return out;
}

export function generateWeeklySchedule(
  userId: string,
  locationMode: LocationMode,
  focusMuscle: string,
  daysPerWeek: number,
  experience: Experience = "beginner",
  weekIndex = 0 // 0 untuk minggu pertama; naik tiap minggu untuk variasi
) {
  const key = focusMuscle === "back_chest" ? "back_chest" : "glutes_lower";
  const templates = FOCUS_TEMPLATES[key];
  const activeDays = ACTIVE_DAYS_MAP[daysPerWeek] ?? ACTIVE_DAYS_MAP[4];

  const pool = EXERCISES.filter((ex) => {
    if ((ex as any).deprecated) return false;
    if (locationMode === "home" && ex.location === "gym") return false;
    if (experience === "beginner" && ex.level === "intermediate") return false;
    return true;
  });

  let workoutIndex = 0;

  return [1, 2, 3, 4, 5, 6, 7].map((day) => {
    if (!activeDays.includes(day)) {
      return { user_id: userId, day_of_week: day, day_title: "Istirahat & Pemulihan", is_rest_day: true, exercise_ids: [] as string[] };
    }

    const blueprint = templates[workoutIndex % templates.length];
    workoutIndex++;

    const used = new Set<string>();
    const ids: string[] = [];
    for (const slot of blueprint.groups) {
      const candidates = pool
        .filter((ex) => ex.muscleGroup === slot.group && !used.has(ex.id))
        .sort((a, b) => rank(a, locationMode) - rank(b, locationMode));
      for (const ex of pick(candidates, slot.count, weekIndex * slot.count)) {
        used.add(ex.id);
        ids.push(ex.id);
      }
    }

    return { user_id: userId, day_of_week: day, day_title: blueprint.title, is_rest_day: false, exercise_ids: ids };
  });
}
```

Catatan:

- Mode `home` dengan pemula: pastikan tiap grup otot punya cukup kandidat. Tambahkan unit test (bagian 12).
- Gerakan di rumah yang butuh perabot (kursi, meja, palang): tampilkan `equipment` di UI agar user tahu.
- Menyimpan jadwal memakai `upsert` pada `(user_id, day_of_week)` supaya regenerate tidak menggandakan baris.

## 8. Layar latihan aktif

### 8.1 Alur satu sesi

1. Buka `/workout/[day]`. Ambil `exercise_ids` dari jadwal (cache lokal bila ada).
2. Muat beban terakhir lewat RPC (cache memori; bila offline gunakan cache lokal terakhir).
3. User mengisi KG dan Rep/Detik per set, lalu menekan centang.
4. Saat centang pertama: `unlockAudio()`, mulai timer istirahat, tulis log ke antrean lokal.
5. Antrean disinkron ke Supabase di background; badge status menampilkan "tersimpan" atau "menunggu sinkron (n)".
6. Akhir sesi: ringkasan singkat (total set, volume). Dashboard memperbarui progres.

### 8.2 Timer istirahat (`useRestTimer`)

Berbasis timestamp. Interval hanya untuk memperbarui tampilan, sumber kebenaran adalah `endTime`.

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

  const start = useCallback((seconds: number) => {
    endRef.current = Date.now() + seconds * 1000;
    firedRef.current = false;
    setRemaining(seconds);
  }, []);

  const stop = useCallback(() => { endRef.current = null; setRemaining(0); }, []);
  const add = useCallback((s: number) => { if (endRef.current) endRef.current += s * 1000; tick(); }, [tick]);

  return { remaining, start, stop, add, running: endRef.current != null };
}
```

### 8.3 Audio dan getar

- `AudioContext` dibuat dan di-resume di dalam handler tap pertama (syarat iOS Safari).
- Pada `visibilitychange` ke visible, panggil `audioCtx.resume()` lagi (iOS bisa menaruh context di state `suspended` atau `interrupted`).
- Getar: `navigator.vibrate?.([200, 100, 200])`. Aman, diabaikan di iOS.
- **Batasan yang harus dikomunikasikan:** jika layar terkunci atau app dipindah ke background di iPhone, beep tidak akan berbunyi. Saat user kembali, timer langsung menampilkan status selesai.

### 8.4 Wake Lock (`useWakeLock`)

Menjaga layar tetap menyala selama sesi latihan. Didukung iOS 16.4+ dan Android Chrome.

```ts
import { useEffect } from "react";

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try { lock = await navigator.wakeLock.request("screen"); } catch { /* ditolak, abaikan */ }
    };
    const onVisible = () => { if (!document.hidden) request(); };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => { document.removeEventListener("visibilitychange", onVisible); lock?.release(); };
  }, [active]);
}
```

### 8.5 Stopwatch untuk gerakan `duration`

Gerakan seperti Plank dan Dead Bug butuh tombol **Mulai** (hitung naik atau mundur dari target) yang mengisi kolom detik otomatis saat selesai. Prinsipnya sama dengan timer istirahat: berbasis timestamp.

### 8.6 Antrean log offline (`lib/logQueue.ts`)

Prinsip:

- Setiap set yang dicentang ditulis ke IndexedDB (atau `localStorage` untuk versi sederhana) sebagai item `{ workout_date, exercise_id, set_number, weight_kg, reps_or_seconds }`.
- `flush()` mengirim semua item dengan `upsert` ber-`onConflict` pada unique constraint. Karena idempoten, pengiriman ulang aman.
- `flush()` dipanggil saat: set dicentang, event `online`, app kembali visible, dan saat halaman dibuka.
- Item dihapus dari antrean hanya setelah Supabase mengonfirmasi sukses.
- Mengubah nilai set yang sudah dicentang = tulis ulang item yang sama (kunci unik sama).
- Badge status menampilkan jumlah item yang belum tersinkron.
- Cache jadwal dan beban terakhir di lokal supaya halaman latihan tetap bisa dibuka tanpa sinyal.

Untuk gambar gerakan offline, tambahkan service worker (Serwist/`next-pwa` atau script manual) dengan strategi `CacheFirst` untuk domain jsDelivr. Tanpa itu, gambar tidak muncul saat offline. Ini fitur Fase 5.

### 8.7 Animasi gerakan (`ExerciseAnimator`)

Lebih hemat baterai dengan CSS, tanpa re-render React tiap 900 ms:

```tsx
// dua <img> bertumpuk; frame kedua memakai animation delay
<div ref={ref} className="animator" data-paused={!visible}>
  <img src={`${CDN}/${id}/0.jpg`} alt="" className="frame frame-a" />
  <img src={`${CDN}/${id}/1.jpg`} alt="" className="frame frame-b" />
</div>
```

```css
.animator .frame { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.frame-a { animation: flipA 1.8s steps(1, end) infinite; }
.frame-b { animation: flipB 1.8s steps(1, end) infinite; }
@keyframes flipA { 0%{opacity:1} 50%{opacity:0} }
@keyframes flipB { 0%{opacity:0} 50%{opacity:1} }
.animator[data-paused="true"] .frame { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .frame { animation: none; } .frame-b { opacity: 0; } }
```

- `IntersectionObserver` tetap dipakai hanya untuk mengisi `visible`. Pada `document.hidden` browser sudah menghentikan animasi CSS.
- Frame kedua jangan `loading="lazy"` saat kartu aktif; gunakan `<link rel="preload">` atau muat bersamaan agar flip pertama tidak berkedip.
- Beri `onError` fallback (placeholder) bila gambar gagal dimuat.

## 9. Desain UI/UX

### 9.1 Orientasi

Variant `landscape:` Tailwind juga aktif pada tablet dan desktop lebar. Batasi dengan custom variant berbasis tinggi layar, mis. `@media (orientation: landscape) and (max-height: 500px)`, lalu pakai untuk layout dua kolom.

| Area | Portrait | Landscape ponsel |
| --- | --- | --- |
| Wrapper | `flex flex-col min-h-dvh` + padding bawah untuk timer | `grid grid-cols-12 h-dvh overflow-hidden` |
| Visual & panduan | Atas, tinggi `h-52` | Kolom kiri `col-span-5`: animasi besar + tips + tombol Ganti Gerakan |
| Input set & timer | Di bawah gambar, tombol -/+ minimal 44×44 px | Kolom kanan `col-span-7 overflow-y-auto` + timer di bawah |
| Navigasi gerakan | Step tabs `1/6, 2/6…` di atas | Pill stepper di atas kolom kanan |

### 9.2 iOS dan PWA

- `viewport-fit=cover` pada meta viewport.
- Padding `env(safe-area-inset-bottom)` untuk timer mengambang dan tombol bawah.
- `apple-touch-icon` 180×180, ikon 192 dan 512 di `manifest.ts`, `display: "standalone"`.
- Unit `dvh` untuk tinggi layar penuh.

### 9.3 Layar dan alur

- **Login:** satu halaman, mode Masuk/Daftar, tampilkan pesan error jelas.
- **Onboarding:** 3 kartu (Rumah/Gym, Fokus, Hari per minggu) + pilihan level (Pemula/Menengah). Tombol "Mulai Program" memanggil generator lalu `upsert` jadwal dan mengisi `program_started_on`.
- **Dashboard:** header progres minggu ini (hari selesai / hari aktif), kartu Senin–Minggu, hari ini ditonjolkan, tombol "Mulai Latihan". Ada quick switch Rumah/Gym untuk hari itu saja.
- **Latihan aktif:** sesuai bagian 8, plus tombol "Selesai Latihan" dan ringkasan.
- **Jangan menyalin tampilan aplikasi lain secara identik.** Ambil alur fungsinya, rancang visual sendiri.

### 9.4 Aksesibilitas dasar

Target sentuh ≥ 44 px, kontras teks cukup di mode gelap, label `aria-label` pada tombol ikon, `alt` bermakna pada gambar gerakan.

## 10. Auth dan routing

- `lib/supabase/client.ts`: `createBrowserClient`. `lib/supabase/server.ts`: `createServerClient` dengan cookies.
- `middleware.ts`: segarkan sesi dan redirect ke `/login` untuk `/dashboard`, `/workout/*`, `/onboarding` bila belum login. Redirect ke `/dashboard` bila sudah login dan membuka `/login`.
- Setelah login: jika `program_started_on` masih null, arahkan ke `/onboarding`; selain itu ke `/dashboard`.
- Semua halaman dengan state interaktif memakai `"use client"`; data awal bisa diambil di server component.

## 11. Progresi beban (opsional, Fase 6)

Aturan sederhana (double progression):

1. Tiap gerakan punya rentang rep `min–max`.
2. Jika semua set tercatat di `max` rep pada sesi terakhir, sarankan naik beban kecil (mis. +1–2,5 kg untuk dumbbell) dan kembali ke `min` rep.
3. Tampilkan sebagai saran lembut ("Coba naikkan ke X kg"), jangan paksa.
4. Untuk `loadType: "assist"`, logika dibalik (kurangi bantuan).
5. Untuk gerakan bodyweight (0 kg), saran pertama adalah menambah rep, baru menambah beban.

## 12. Pengujian dan verifikasi

### 12.1 Script validasi katalog

`scripts/check-exercises.mjs`: baca semua `id` dari katalog, lakukan `HEAD` ke `${CDN}/${id}/0.jpg` dan `1.jpg`, laporkan yang bukan 200. Jalankan sebelum rilis dan setiap katalog berubah. Sekaligus membuktikan bahwa SHA dan struktur path benar.

### 12.2 Unit test (Vitest)

- `todayLocal`, `toDayOfWeek`, `weekRange` pada kasus Senin, Minggu, pergantian bulan dan tahun.
- `generateWeeklySchedule`: untuk setiap kombinasi (home/gym/both × fokus × 2–5 hari × pemula/menengah) pastikan tiap hari latihan punya jumlah gerakan sesuai template, tanpa duplikat, tanpa gerakan gym pada mode home.
- Tidak ada dua hari kaki berturut-turut pada pola 4 dan 5 hari.
- `logQueue`: flush idempoten, item tidak hilang bila request gagal.

### 12.3 Uji manual di perangkat

| Skenario | Yang dicek |
| --- | --- |
| iPhone Safari | Beep berbunyi setelah tap pertama, Wake Lock aktif, safe area aman |
| Android Chrome | Getar, layar menyala, add to home screen |
| Mode pesawat di tengah sesi | Set tetap bisa dicentang, badge "menunggu sinkron", sinkron saat online |
| Latihan jam 05.00 WIB | Log bertanggal hari yang benar |
| Centang, batalkan, centang ulang | Tidak ada baris ganda |
| Pindah app 30 detik saat timer | Sisa waktu benar saat kembali |
| Rotasi layar | Layout tidak patah di portrait dan landscape |
| ID gerakan tidak dikenal | Fallback tampil, tidak crash |

### 12.4 Keamanan

- Pastikan RLS aktif di ketiga tabel dan coba akses data user lain dengan akun kedua (harus gagal).
- Jangan pernah memakai `service_role` key di client.
- Variabel lingkungan: hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di sisi browser.

## 13. Roadmap per fase

Estimasi untuk satu developer yang sudah familiar dengan Next.js dan Supabase. Sesuaikan dengan pengalaman.

| Fase | Isi | Estimasi |
| --- | --- | --- |
| 1. Fondasi | Project Next.js, Tailwind, `@supabase/ssr`, skema SQL, RLS, trigger, middleware, halaman login | 1–2 hari |
| 2. Data & jadwal | `exercises.ts` (struktur baru + koreksi), script validasi katalog, `scheduleGenerator`, `lib/date.ts`, unit test, onboarding | 2 hari |
| 3. Dashboard & latihan inti | Dashboard mingguan + progres, layar latihan aktif portrait, input set, auto-fill RPC, upsert log, timer istirahat, audio | 3–4 hari |
| 4. Kenyamanan sesi | Wake Lock, stopwatch duration, `ExerciseAnimator` CSS, swap gerakan, ringkasan sesi | 2–3 hari |
| 5. Offline & PWA | `logQueue`, badge sinkron, manifest, ikon, service worker untuk gambar | 2–3 hari |
| 6. Penyempurnaan | Layout landscape ponsel, progresi beban, riwayat per gerakan, ganti password | 2–3 hari |

**Definisi selesai MVP (akhir Fase 3):** user bisa daftar, memilih preferensi, melihat jadwal, mencatat satu sesi penuh dengan beban terisi otomatis dari sesi sebelumnya, dan melihat progres minggu ini, dengan tanggal yang benar di WIB.

## 14. Risiko dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| SHA atau path gambar salah | Script validasi (12.1) sebelum membangun UI |
| ID gerakan berubah atau hilang | Aturan katalog (6.3) + fallback UI |
| Sinyal gym buruk | Antrean log offline (8.6) |
| Beep tak berbunyi di iPhone saat terkunci | Wake Lock + status "selesai" saat kembali; jelaskan ke user |
| Pemula memakai beban bebas berat | Filter `level`, `caution` pada gerakan berisiko |
| Lupa password (tanpa konfirmasi email) | Halaman ganti password, atau aktifkan email auth bila dipakai publik |
| Scope membengkak | Patuhi fase; rilis MVP dulu |

## 15. Langkah berikutnya

1. Jalankan SQL bagian 5.2 di Supabase SQL Editor.
2. Buat `scripts/check-exercises.mjs` dan jalankan untuk 81 ID.
3. Perbarui `exercises.ts` ke struktur baru dan terapkan koreksi bagian 6.2.
4. Kerjakan `lib/date.ts` dan `scheduleGenerator.ts` beserta unit test.
5. Lanjut ke login, onboarding, dashboard, lalu layar latihan aktif.
