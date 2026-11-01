import { Loader2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import ClientOnly from "@/components/ClientOnly";
import { getExercise } from "@/data/exercises";
import { getSessionContext } from "@/lib/supabase/server";
import WorkoutSession, { type ExerciseData, type LastMap, type SavedLog } from "@/components/workout/WorkoutSession";

export default async function SesiPage(props: PageProps<"/sesi/[id]">) {
  const { id } = await props.params;
  const { supabase, user, profile } = await getSessionContext();

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, workout_position, workout_title, exercise_ids, started_at, finished_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!session) notFound();
  if (session.finished_at) redirect(`/sesi/${id}/ringkasan`);

  // ID tak dikenal dilewati supaya UI tidak crash.
  const exercises: ExerciseData[] = (session.exercise_ids as string[]).flatMap((exId) => {
    const ex = getExercise(exId);
    return ex
      ? [{
          id: ex.id,
          name: ex.name,
          equipment: ex.equipment,
          metric: ex.metric,
          sets: ex.sets,
          target: ex.target,
          defaultValue: ex.defaultValue,
          restSeconds: ex.restSeconds,
          targetSeconds: ex.targetSeconds ?? null,
          tips: ex.tips,
        }]
      : [];
  });
  if (exercises.length === 0) redirect("/dashboard");

  const [{ data: logs }, { data: lastLogs }] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("exercise_id, set_number, weight_kg, reps_or_seconds")
      .eq("session_id", id),
    supabase.rpc("get_last_exercise_logs", {
      p_exercise_ids: exercises.map((e) => e.id),
      p_exclude_session: id,
    }),
  ]);

  const saved: SavedLog[] = (logs ?? []).map((l) => ({
    exerciseId: l.exercise_id,
    setNumber: l.set_number,
    weight: Number(l.weight_kg),
    reps: l.reps_or_seconds,
  }));

  const lastMap: LastMap = {};
  for (const l of (lastLogs ?? []) as { exercise_id: string; set_number: number; weight_kg: number; reps_or_seconds: number }[]) {
    (lastMap[l.exercise_id] ??= {})[l.set_number] = { weight: Number(l.weight_kg), reps: l.reps_or_seconds };
  }

  return (
    <ClientOnly
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-ink-secondary">
          <Loader2 className="size-6 animate-spin" />
        </main>
      }
    >
    <WorkoutSession
      sessionId={id}
      userId={user.id}
      title={session.workout_title}
      position={session.workout_position}
      startedAt={session.started_at}
      exercises={exercises}
      saved={saved}
      lastMap={lastMap}
      weightStep={profile.weight_step}
    />
    </ClientOnly>
  );
}
