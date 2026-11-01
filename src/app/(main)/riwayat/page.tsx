import { ChevronRight, History, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { getExercise } from "@/data/exercises";
import { formatDuration, formatShortDate } from "@/lib/date";
import { getSessionContext } from "@/lib/supabase/server";
import { formatWeight } from "@/lib/weight";

interface SessionRow {
  id: string;
  workout_title: string;
  local_date: string;
  started_at: string;
  finished_at: string | null;
  workout_logs: { count: number }[];
}
interface LogRow { exercise_id: string; weight_kg: number; reps_or_seconds: number; created_at: string; session_id: string }

export default async function RiwayatPage() {
  const { supabase, user, today } = await getSessionContext();

  const [{ data: sessionData }, { data: logData }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, workout_title, local_date, started_at, finished_at, workout_logs(count)")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(40),
    supabase
      .from("workout_logs")
      .select("exercise_id, weight_kg, reps_or_seconds, created_at, session_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const sessions = ((sessionData ?? []) as SessionRow[]).filter(
    (s) => s.finished_at || (s.workout_logs[0]?.count ?? 0) > 0,
  );
  const logs = (logData ?? []) as LogRow[];

  const monthPrefix = today.slice(0, 7);
  const thisMonth = sessions.filter((s) => s.local_date.startsWith(monthPrefix)).length;

  // Progres per gerakan: nilai terakhir + rekor.
  const byExercise = new Map<string, LogRow[]>();
  for (const l of logs) {
    const list = byExercise.get(l.exercise_id) ?? [];
    list.push(l);
    byExercise.set(l.exercise_id, list);
  }
  const progress = [...byExercise.entries()]
    .map(([exId, list]) => {
      const ex = getExercise(exId);
      if (!ex) return null;
      const weighted = list.some((l) => Number(l.weight_kg) > 0);
      const val = (l: LogRow) => (weighted ? Number(l.weight_kg) : l.reps_or_seconds);
      const lastSession = list[0].session_id;
      const lastTop = list.filter((l) => l.session_id === lastSession).reduce((a, b) => (val(b) > val(a) ? b : a));
      const best = list.reduce((a, b) => (val(b) > val(a) ? b : a));
      const sessionsCount = new Set(list.map((l) => l.session_id)).size;
      const unit = ex.metric === "duration" ? "dtk" : weighted ? "kg" : "rep";
      const fmt = (l: LogRow) => (weighted ? formatWeight(Number(l.weight_kg)) : String(l.reps_or_seconds));
      return {
        id: exId,
        name: ex.name,
        sessionsCount,
        last: fmt(lastTop),
        lastReps: weighted ? lastTop.reps_or_seconds : null,
        best: fmt(best),
        unit,
        atBest: val(lastTop) >= val(best),
        lastAt: list[0].created_at,
      };
    })
    .filter((x) => x !== null)
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  return (
    <main className="px-5 pt-[calc(20px+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-[480px]">
        <p className="text-xs font-bold tracking-wider text-primary">RINGKASAN AKTIVITAS</p>
        <h1 className="text-[28px] font-extrabold tracking-tight">Riwayat Latihan</h1>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <Stat value={sessions.length >= 40 ? "40+" : String(sessions.length)} label="Total sesi" />
          <Stat value={String(thisMonth)} label="Bulan ini" />
          <Stat value={String(logs.length >= 2000 ? "2000+" : logs.length)} label="Total set" />
        </div>

        {sessions.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-[20px] border border-dashed border-line px-6 py-10 text-center">
            <History className="size-10 text-ink-muted" />
            <p className="mt-3 font-bold">Belum ada riwayat</p>
            <p className="mt-1 text-sm text-ink-secondary">Selesaikan latihan pertamamu, hasilnya muncul di sini.</p>
            <Link href="/dashboard" className="mt-5 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white">
              Mulai Latihan
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-7">
              <h2 className="mb-3 text-lg font-bold">Sesi terakhir</h2>
              <div className="space-y-2">
                {sessions.slice(0, 10).map((s) => {
                  const href = s.finished_at ? `/sesi/${s.id}/ringkasan` : `/sesi/${s.id}`;
                  const dur = s.finished_at
                    ? formatDuration((new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 1000)
                    : "Belum selesai";
                  return (
                    <Link key={s.id} href={href} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 active:scale-[0.99]">
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-[11px] font-bold uppercase text-ink-muted">{formatShortDate(s.local_date).split(",")[0]}</p>
                        <p className="text-xl font-extrabold leading-tight">{Number(s.local_date.slice(8))}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold">{s.workout_title}</p>
                        <p className={`text-[13px] ${s.finished_at ? "text-ink-muted" : "text-warning"}`}>
                          {s.workout_logs[0]?.count ?? 0} set · {dur}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-ink-muted" />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-lg font-bold">Progres per gerakan</h2>
                <p className="text-xs text-ink-muted">{progress.length} gerakan</p>
              </div>
              <div className="space-y-2.5">
                {progress.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-line bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-bold">{p.name}</p>
                      <span className="shrink-0 rounded-full bg-interactive px-2.5 py-1 text-[11px] font-semibold text-ink-secondary">
                        {p.sessionsCount} sesi
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-surface/60 px-3 py-2.5">
                        <p className="text-xs text-ink-secondary">Terakhir</p>
                        <p className="text-xl font-extrabold tabular">
                          {p.last} <span className="text-sm font-semibold text-ink-secondary">{p.unit}</span>
                          {p.lastReps !== null && <span className="text-sm font-semibold text-ink-muted"> × {p.lastReps}</span>}
                        </p>
                      </div>
                      <div className="rounded-xl bg-surface/60 px-3 py-2.5">
                        <p className="flex items-center gap-1 text-xs text-success">
                          <Trophy className="size-3" /> Rekor
                        </p>
                        <p className="text-xl font-extrabold tabular">
                          {p.best} <span className="text-sm font-semibold text-ink-secondary">{p.unit}</span>
                        </p>
                      </div>
                    </div>
                    {p.atBest && p.sessionsCount > 1 && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-success">
                        <TrendingUp className="size-3.5" /> Sedang di performa terbaik
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-3.5 text-center">
      <p className="text-2xl font-extrabold tabular">{value}</p>
      <p className="text-xs text-ink-secondary">{label}</p>
    </div>
  );
}
