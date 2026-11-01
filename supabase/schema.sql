-- Raga Fit — skema Supabase v2 (jadwal fleksibel + sesi latihan)
-- Jalankan SELURUH script ini di Supabase SQL Editor.
-- PERHATIAN: bagian 0 menghapus tabel lama beserta datanya (aman selama masih MVP).

-- 0. Reset skema lama
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.get_last_exercise_logs(text[]);
drop function if exists public.get_last_exercise_logs(text[], uuid);
drop table if exists public.workout_logs cascade;
drop table if exists public.workout_sessions cascade;
drop table if exists public.user_schedules cascade;
drop table if exists public.program_workouts cascade;
drop table if exists public.profiles cascade;

-- 1. Profil
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Atlet',
  location_mode text not null default 'both'
    check (location_mode in ('home','gym','both')),
  focus_muscle text not null default 'glutes_lower'
    check (focus_muscle in ('glutes_lower','back_chest')),
  -- Hari rencana latihan (Senin = 1 ... Minggu = 7). Hanya rencana, bukan kunci.
  planned_days int[] not null default '{1,3,5}'
    check (cardinality(planned_days) between 2 and 6 and planned_days <@ array[1,2,3,4,5,6,7]),
  weight_step numeric(3,1) not null default 1 check (weight_step in (1, 2.5, 5)),
  timezone text not null default 'Asia/Jakarta',
  program_started_on date,
  created_at timestamptz not null default now()
);

-- 2. Program = rotasi latihan (Latihan A, B, C, ...), tidak terikat hari
create table public.program_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  position int not null check (position >= 1),
  title text not null,
  exercise_ids text[] not null default '{}',
  unique (user_id, position)
);

-- 3. Sesi latihan
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_workout_id uuid references public.program_workouts(id) on delete set null,
  workout_position int not null,           -- salinan, tetap ada walau program diganti
  workout_title text not null,             -- salinan judul untuk riwayat
  exercise_ids text[] not null default '{}',
  local_date date not null,                -- tanggal di zona waktu user
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index idx_sessions_user_date on public.workout_sessions (user_id, local_date desc);

-- 4. Log set
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id text not null,
  set_number int not null check (set_number >= 1),
  weight_kg numeric(5,1) not null default 0 check (weight_kg >= 0), -- 0 = berat badan
  reps_or_seconds int not null check (reps_or_seconds >= 0),
  created_at timestamptz not null default now(),
  constraint uq_log_set unique (session_id, exercise_id, set_number)
);

create index idx_logs_memory on public.workout_logs (user_id, exercise_id, created_at desc);

-- 5. RPC: nilai terakhir per gerakan & set, di luar sesi yang sedang berjalan
create or replace function public.get_last_exercise_logs(p_exercise_ids text[], p_exclude_session uuid)
returns table (exercise_id text, set_number int, weight_kg numeric, reps_or_seconds int)
language sql stable security invoker
set search_path = public
as $$
  select distinct on (l.exercise_id, l.set_number)
    l.exercise_id, l.set_number, l.weight_kg, l.reps_or_seconds
  from public.workout_logs l
  where l.user_id = auth.uid()
    and l.exercise_id = any(p_exercise_ids)
    and l.session_id is distinct from p_exclude_session
  order by l.exercise_id, l.set_number, l.created_at desc;
$$;

-- 6. Profil otomatis saat daftar (nama dari form daftar, cadangan: depan email)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(new.email, '@', 1),
      'Atlet'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Akun yang sudah ada sebelum reset: buatkan profil lagi.
insert into public.profiles (id, display_name)
select u.id, coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'), ''), split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- 7. RLS
alter table public.profiles enable row level security;
alter table public.program_workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_logs enable row level security;

create policy "profil sendiri" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "program sendiri" on public.program_workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sesi sendiri" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "log sendiri" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
