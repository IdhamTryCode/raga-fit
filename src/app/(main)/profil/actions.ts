"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/lib/supabase/server";

export interface ProfileState { ok?: boolean; error?: string }

export async function updateName(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const { supabase, user } = await getSessionContext();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) return { error: "Nama 2–40 karakter." };

  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  if (error) return { error: "Gagal menyimpan. Coba lagi." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateWeightStep(step: number): Promise<void> {
  if (![1, 2.5, 5].includes(step)) return;
  const { supabase, user } = await getSessionContext();
  await supabase.from("profiles").update({ weight_step: step }).eq("id", user.id);
  revalidatePath("/profil");
}
