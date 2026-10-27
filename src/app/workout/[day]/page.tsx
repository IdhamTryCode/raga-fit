import { redirect } from "next/navigation";
import { getExercise } from "@/data/exercises";
import { createClient } from "@/lib/supabase/server";
import WorkoutSession, {
  type ExerciseData,
  type LastLogmap,
} from "@/components/WorkoutSession";

export default async function WorkoutPage(
  props: PageProps<"/workout/[day]">,
) {
  const { day: dayParam } = await props.params;
  const day = Number(dayParam);
  if (!Number.isInteger(day) || day < 1 || day > 7) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: scheduleRow }] = await Promise.all([
    supabase
      .from("user_schedules")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_of_week", day)
      .maybeSingle(),
  ]);

  if (!scheduleRow || scheduleRow.is_rest_day) redirect("/dashboard");

  const ids = scheduleRow.exercise_ids as string[];
  const exercises: ExerciseData[] = [];
  for (const id of ids) {
    const ex = getExercise(id);
    if (ex) {
      exercises.push({
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
      });
    }
    // ID tidak dikenal dilewati — UI tidak boleh crash (aturan katalog bagian 7).
  }
  if (exercises.length === 0) redirect("/dashboard");

  const { data: lastLogs } = await supabase.rpc("get_last_exercise_logs", {
    p_exercise_ids: ids,
  });

  const lastMap: LastLogmap = {};
  for (const log of lastLogs ?? []) {
    if (!(log.exercise_id in lastMap)) lastMap[log.exercise_id] = {};
    lastMap[log.exercise_id][log.set_number] = {
      weight: Number(log.weight_kg),
      reps: log.reps_or_seconds,
    };
  }

  return (
    <WorkoutSession
      dayTitle={scheduleRow.day_title}
      exercises={exercises}
      lastMap={lastMap}
    />
  );
}
