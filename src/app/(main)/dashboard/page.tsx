import { Check, Moon, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getExercise } from "@/data/exercises";
import { DAY_SHORT, dayOfWeek, formatLongDate, weekDates } from "@/lib/date";
import { LETTERS, nextPosition, workoutStats } from "@/lib/program";
import { getSessionContext } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import { startSession } from "@/app/sesi/actions";

interface SessionRow {
  id: string;
  program_workout_id: string | null;
  workout_position: number;
  workout_title: string;
  local_date: string;
  finished_at: string | null;
  workout_logs: { count: number }[];
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const { supabase, user, profile, today } = await getSessionContext();
  const { gagal } = await props.searchParams;
  const week = weekDates(today);

  const [programRes, weekRes, lastRes] = await Promise.all([
    supabase
      .from("program_workouts")
      .select("id, position, title, exercise_ids")
      .eq("user_id", user.id)
      .order("position"),
    supabase
      .from("workout_sessions")
      .select("id, program_workout_id, workout_position, workout_title, local_date, finished_at, workout_logs(count)")
      .eq("user_id", user.id)
      .gte("local_date", week[0])
      .lte("local_date", week[6])
      .order("started_at", { ascending: false }),
    supabase
      .from("workout_sessions")
      .select("id, workout_position, local_date, finished_at, workout_logs(count)")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  const program = programRes.data ?? [];
  const weekSessions = (weekRes.data ?? []) as SessionRow[];
  const counted = (s: SessionRow) => !!s.finished_at || (s.workout_logs[0]?.count ?? 0) > 0;

  const trainedDates = new Set(weekSessions.filter(counted).map((s) => s.local_date));
  const openToday = weekSessions.find((s) => s.local_date === today && !s.finished_at);

  // Sesi terakhir yang "terhitung" (selesai, atau ada set tercatat walau lupa ditekan Selesai),
  // tidak termasuk sesi yang sedang berjalan hari ini.
  const lastCounted = ((lastRes.data ?? []) as Pick<SessionRow, "id" | "workout_position" | "local_date" | "finished_at" | "workout_logs">[])
    .filter((s) => s.id !== openToday?.id)
    .find((s) => !!s.finished_at || (s.workout_logs[0]?.count ?? 0) > 0);
  const next = program.find((w) => w.position === nextPosition(lastCounted?.workout_position ?? null, program.length));
  const hero = (openToday && program.find((w) => w.id === openToday.program_workout_id)) || next;
  const resuming = !!openToday && hero?.id === openToday.program_workout_id;
  const doneToday = weekSessions.some((s) => s.local_date === today && s.finished_at);

  const planned = profile.planned_days;
  const isPlannedToday = planned.includes(dayOfWeek(today));
  const weekDone = trainedDates.size;
  const weekTarget = planned.length;
  const pct = Math.min(100, Math.round((weekDone / weekTarget) * 100));

  return (
    <main className="px-5 pt-[calc(20px+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-[480px]">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-ink-secondary">{formatLongDate(today)}</p>
            <h1 className="truncate text-[28px] font-extrabold tracking-tight">Halo, {profile.display_name}</h1>
          </div>
          <Link
            href="/profil"
            aria-label="Profil"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-extrabold text-primary"
          >
            {profile.display_name.charAt(0).toUpperCase()}
          </Link>
        </header>

        {gagal && (
          <p role="alert" className="mt-4 rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-[#ffb3a1]">
            Gagal memulai latihan. Periksa koneksi lalu coba lagi.
          </p>
        )}

        {/* Minggu ini */}
        <section className="mt-6 rounded-[20px] border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold">Minggu ini</p>
            <p className={`text-sm font-bold ${weekDone >= weekTarget ? "text-success" : "text-ink-secondary"}`}>
              {weekDone}/{weekTarget} latihan
            </p>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {week.map((date, i) => {
              const trained = trainedDates.has(date);
              const isToday = date === today;
              const isPlanned = planned.includes(i + 1);
              return (
                <div
                  key={date}
                  className={`flex h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl ${
                    isToday ? "border-[1.5px] border-primary bg-primary-soft" : "bg-interactive/60"
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-ink-secondary"}`}>
                    {DAY_SHORT[i]}
                  </span>
                  {trained ? (
                    <span className="flex size-6 items-center justify-center rounded-full bg-success text-surface">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  ) : isPlanned ? (
                    <span className={`size-2 rounded-full ${date < today ? "bg-ink-muted" : "bg-primary"}`} />
                  ) : (
                    <Moon className="size-3.5 text-ink-muted" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 h-2 rounded-full bg-interactive">
            <div
              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-success" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>

        {/* Latihan berikutnya */}
        {hero ? (
          <HeroCard
            workout={hero}
            resuming={resuming}
            restDay={!isPlannedToday && !resuming}
            doneToday={doneToday && !resuming}
            sessionId={resuming ? openToday!.id : null}
          />
        ) : (
          <section className="mt-5 rounded-[20px] border border-line bg-card p-5 text-center">
            <p className="font-semibold">Program belum ada.</p>
            <Link href="/onboarding" className="mt-3 inline-block font-bold text-primary">
              Susun program
            </Link>
          </section>
        )}

        {/* Program */}
        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold">Program kamu</h2>
            <p className="text-xs text-ink-muted">Bebas pilih urutan</p>
          </div>
          <div className="space-y-2.5">
            {program.map((w) => {
              const isNext = w.id === next?.id;
              return (
                <form key={w.id} action={startSession.bind(null, w.id)}>
                  <SubmitButton className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 text-left transition active:scale-[0.99]">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${
                        isNext ? "bg-primary text-white" : "bg-interactive text-ink-secondary"
                      }`}
                    >
                      {LETTERS[w.position - 1]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{w.title}</span>
                      <span className="block text-[13px] text-ink-muted">
                        {w.exercise_ids.length} gerakan{isNext ? " · Berikutnya" : ""}
                      </span>
                    </span>
                    <Play className="size-4 shrink-0 text-ink-muted" />
                  </SubmitButton>
                </form>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function HeroCard({
  workout,
  resuming,
  restDay,
  doneToday,
  sessionId,
}: {
  workout: { id: string; position: number; title: string; exercise_ids: string[] };
  resuming: boolean;
  restDay: boolean;
  doneToday: boolean;
  sessionId: string | null;
}) {
  const stats = workoutStats(workout.exercise_ids);
  const names = workout.exercise_ids.map((id) => getExercise(id)?.name).filter(Boolean) as string[];

  const badge = resuming ? "SEDANG BERJALAN" : doneToday ? "SUDAH LATIHAN HARI INI" : restDay ? "HARI ISTIRAHAT" : "LATIHAN HARI INI";
  const note = doneToday
    ? "Mantap! Kalau masih kuat, latihan berikutnya sudah siap."
    : restDay
      ? "Hari ini jadwal istirahat. Tetap mau latihan? Boleh banget."
      : null;

  return (
    <section className="relative mt-5 overflow-hidden rounded-[20px] border-[1.5px] border-primary bg-card p-5 shadow-[0_4px_20px_rgba(255,90,44,0.15)]">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">{badge}</span>
        <span className="text-xs font-semibold text-ink-muted">Latihan {LETTERS[workout.position - 1]}</span>
      </div>
      <h2 className="mt-3 text-[22px] font-extrabold leading-tight tracking-tight">{workout.title}</h2>
      {note && <p className="mt-1.5 text-sm text-ink-secondary">{note}</p>}

      <div className="mt-4 grid grid-cols-3 rounded-2xl bg-surface/60 py-3 text-center">
        <Stat value={String(stats.exercises)} label="Gerakan" />
        <Stat value={`~${stats.minutes}`} label="Menit" />
        <Stat value={String(stats.sets)} label="Total set" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {names.slice(0, 4).map((n) => (
          <span key={n} className="rounded-full bg-interactive px-3 py-1.5 text-xs font-medium text-ink-secondary">
            {n}
          </span>
        ))}
        {names.length > 4 && (
          <span className="rounded-full bg-interactive px-3 py-1.5 text-xs font-medium text-ink-muted">
            +{names.length - 4} lagi
          </span>
        )}
      </div>

      {resuming && sessionId ? (
        <Link
          href={`/sesi/${sessionId}`}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-[0_8px_24px_rgba(255,90,44,0.3)] active:scale-[0.98]"
        >
          <RotateCcw className="size-5" /> Lanjutkan Latihan
        </Link>
      ) : (
        <form action={startSession.bind(null, workout.id)}>
          <SubmitButton
            pendingLabel="Menyiapkan..."
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-[0_8px_24px_rgba(255,90,44,0.3)] active:scale-[0.98]"
          >
            <Play className="size-5 fill-current" /> {restDay || doneToday ? "Tetap Latihan" : "Mulai Latihan"}
          </SubmitButton>
        </form>
      )}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold tabular">{value}</p>
      <p className="text-xs text-ink-secondary">{label}</p>
    </div>
  );
}
