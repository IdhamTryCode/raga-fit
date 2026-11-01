import { Check, Dumbbell, Layers, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getExercise } from "@/data/exercises";
import { formatDuration } from "@/lib/date";
import { getSessionContext } from "@/lib/supabase/server";
import { formatWeight } from "@/lib/weight";

interface Log { exercise_id: string; set_number: number; weight_kg: number; reps_or_seconds: number }

export default async function RingkasanPage(props: PageProps<"/sesi/[id]/ringkasan">) {
  const { id } = await props.params;
  const { supabase, user } = await getSessionContext();

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, workout_title, exercise_ids, started_at, finished_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!session) notFound();
  if (!session.finished_at) redirect(`/sesi/${id}`);

  const exerciseIds = session.exercise_ids as string[];
  const [{ data: logsData }, { data: prevData }] = await Promise.all([
    supabase.from("workout_logs").select("exercise_id, set_number, weight_kg, reps_or_seconds").eq("session_id", id),
    supabase
      .from("workout_logs")
      .select("exercise_id, weight_kg, reps_or_seconds")
      .in("exercise_id", exerciseIds)
      .neq("session_id", id)
      .lt("created_at", session.started_at),
  ]);
  const logs = (logsData ?? []) as Log[];
  const prev = (prevData ?? []) as Omit<Log, "set_number">[];

  const seconds = (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 1000;
  const volume = logs.reduce((s, l) => s + Number(l.weight_kg) * (getExercise(l.exercise_id)?.metric === "reps" ? l.reps_or_seconds : 0), 0);
  const totalReps = logs.reduce((s, l) => s + (getExercise(l.exercise_id)?.metric === "reps" ? l.reps_or_seconds : 0), 0);

  const perExercise = exerciseIds
    .map((exId) => {
      const ex = getExercise(exId);
      const sets = logs.filter((l) => l.exercise_id === exId).sort((a, b) => a.set_number - b.set_number);
      if (!ex || sets.length === 0) return null;
      // Rekor: beban tertinggi (atau repetisi/detik tertinggi bila tanpa beban) melebihi semua sesi sebelumnya.
      const metric = (l: { weight_kg: number; reps_or_seconds: number }) =>
        Number(l.weight_kg) > 0 ? Number(l.weight_kg) : l.reps_or_seconds;
      const usesWeight = sets.some((l) => Number(l.weight_kg) > 0);
      const best = Math.max(...sets.map(metric));
      const prevSets = prev.filter((p) => p.exercise_id === exId && (Number(p.weight_kg) > 0) === usesWeight);
      const prevBest = prevSets.length ? Math.max(...prevSets.map(metric)) : null;
      const isPR = prevBest !== null && best > prevBest;
      const text = sets
        .map((l) =>
          ex.metric === "duration"
            ? `${l.reps_or_seconds} dtk`
            : Number(l.weight_kg) > 0
              ? `${formatWeight(Number(l.weight_kg))}×${l.reps_or_seconds}`
              : `${l.reps_or_seconds}`,
        )
        .join(" · ");
      return { id: exId, name: ex.name, text, isPR, sets: sets.length, planned: ex.sets };
    })
    .filter((x) => x !== null);

  const prCount = perExercise.filter((e) => e.isPR).length;

  return (
    <main className="flex min-h-dvh flex-col px-5 pt-[calc(32px+env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-36 items-center justify-center rounded-full bg-success/10">
            <div className="flex size-20 items-center justify-center rounded-full bg-success text-surface shadow-[0_0_40px_rgba(46,212,122,0.4)]">
              <Check className="size-10" strokeWidth={3} />
            </div>
          </div>
          <h1 className="mt-5 text-[28px] font-extrabold tracking-tight">Latihan selesai!</h1>
          <p className="mt-1 text-[15px] text-ink-secondary">{session.workout_title}</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2.5">
          <StatCard icon={<Timer />} value={formatDuration(seconds)} label="Durasi" />
          <StatCard icon={<Layers />} value={String(logs.length)} label="Total set" />
          {volume > 0 ? (
            <StatCard icon={<Dumbbell />} value={`${formatWeight(volume)} kg`} label="Total beban" />
          ) : (
            <StatCard icon={<Dumbbell />} value={String(totalReps)} label="Total repetisi" />
          )}
        </div>

        {prCount > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3">
            <Trophy className="size-6 shrink-0 text-warning" />
            <p className="text-sm font-semibold">
              {prCount} rekor baru hari ini. Progres nyata!
            </p>
          </div>
        )}

        <section className="mt-6 space-y-2">
          {perExercise.map((e) => (
            <div key={e.id} className="rounded-2xl border border-line bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[15px] font-semibold">{e.name}</p>
                {e.isPR ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-bold text-warning">
                    <Trophy className="size-3" /> REKOR
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-ink-muted">{e.sets}/{e.planned} set</span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] tabular text-ink-secondary">{e.text}</p>
            </div>
          ))}
        </section>

        <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-surface via-surface to-transparent pb-[calc(20px+env(safe-area-inset-bottom))] pt-6">
          <Link
            href="/dashboard"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-bold text-white shadow-[0_8px_24px_rgba(255,90,44,0.3)] active:scale-[0.98]"
          >
            Kembali ke Jadwal
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card px-2 py-4 text-center">
      <span className="text-success [&>svg]:size-5">{icon}</span>
      <p className="mt-2 text-lg font-extrabold leading-tight tabular">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
    </div>
  );
}
