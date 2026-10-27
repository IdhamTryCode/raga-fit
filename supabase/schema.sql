-- Raga Fit — skema Supabase (Masterplan MVP Lite bagian 5.2)
-- Jalankan SEMUA script ini di Supabase SQL Editor, satu kali.

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
