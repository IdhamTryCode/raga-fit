"use server";

import { redirect } from "next/navigation";
import type { LocationMode } from "@/data/exercises";
import { safeTz, todayLocal } from "@/lib/date";
import { generateProgram, type FocusMuscle } from "@/lib/program";
import { createClient } from "@/lib/supabase/server";

export interface ProgramInput {
  locationMode: LocationMode;
  focus: FocusMuscle;
  plannedDays: number[];
  timezone: string;
}

export async function saveProgram(input: ProgramInput): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Validasi ulang di server — input dari client tidak dipercaya.
  if (!["home", "gym", "both"].includes(input.locationMode)) return { error: "Lokasi tidak valid." };
  if (!["glutes_lower", "back_chest"].includes(input.focus)) return { error: "Fokus tidak valid." };
  const days = [...new Set(input.plannedDays)].filter((d) => Number.isInteger(d) && d >= 1 && d <= 7).sort();
  if (days.length < 2 || days.length > 6) return { error: "Pilih 2–6 hari latihan." };
  const tz = safeTz(input.timezone);

  const { data: existing } = await supabase
    .from("profiles")
    .select("program_started_on")
    .eq("id", user.id)
    .maybeSingle();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    location_mode: input.locationMode,
    focus_muscle: input.focus,
    planned_days: days,
    timezone: tz,
    program_started_on: existing?.program_started_on ?? todayLocal(new Date(), tz),
  });
  if (profileError) return { error: "Gagal menyimpan profil. Coba lagi." };

  // Ganti program lama. Riwayat sesi tetap aman (judul & gerakan disalin di sesi).
  const { error: deleteError } = await supabase.from("program_workouts").delete().eq("user_id", user.id);
  if (deleteError) return { error: "Gagal memperbarui program. Coba lagi." };

  const program = generateProgram(input.locationMode, input.focus, days.length);
  const { error: insertError } = await supabase
    .from("program_workouts")
    .insert(program.map((w) => ({ ...w, user_id: user.id })));
  if (insertError) return { error: "Gagal menyusun program. Coba lagi." };

  redirect("/dashboard");
}
