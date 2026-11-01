"use server";

import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/server";

/** Mulai (atau lanjutkan) sesi untuk satu latihan program, hari apa pun. */
export async function startSession(programWorkoutId: string): Promise<void> {
  const { supabase, user, today } = await getSessionContext();

  const { data: workout } = await supabase
    .from("program_workouts")
    .select("id, position, title, exercise_ids")
    .eq("id", programWorkoutId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!workout) redirect("/dashboard");

  // Sesi yang sama hari ini belum selesai → lanjutkan, jangan buat dobel.
  const { data: open } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_workout_id", workout.id)
    .eq("local_date", today)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (open) redirect(`/sesi/${open.id}`);

  const { data: created, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      program_workout_id: workout.id,
      workout_position: workout.position,
      workout_title: workout.title,
      exercise_ids: workout.exercise_ids,
      local_date: today,
    })
    .select("id")
    .single();
  if (error || !created) redirect("/dashboard?gagal=1");

  redirect(`/sesi/${created.id}`);
}

/** Tandai sesi selesai lalu tampilkan ringkasan. */
export async function finishSession(sessionId: string): Promise<void> {
  const { supabase, user } = await getSessionContext();
  await supabase
    .from("workout_sessions")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .is("finished_at", null);
  redirect(`/sesi/${sessionId}/ringkasan`);
}

/** Batalkan sesi: hapus bila belum ada set tercatat, selain itu simpan sebagai selesai. */
export async function abandonSession(sessionId: string): Promise<void> {
  const { supabase, user } = await getSessionContext();
  const { count } = await supabase
    .from("workout_logs")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (!count) {
    await supabase.from("workout_sessions").delete().eq("id", sessionId).eq("user_id", user.id);
  }
  redirect("/dashboard");
}
