import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { safeTz, todayLocal } from "@/lib/date";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component tidak bisa menyetel cookie — proxy.ts yang menyegarkan.
          }
        },
      },
    },
  );
}

export interface Profile {
  id: string;
  display_name: string;
  location_mode: "home" | "gym" | "both";
  focus_muscle: "glutes_lower" | "back_chest";
  planned_days: number[];
  weight_step: number;
  timezone: string;
  program_started_on: string | null;
}

/**
 * User + profil yang sudah login (di-cache per request).
 * Redirect ke /login bila belum login, ke /onboarding bila belum punya program
 * (kecuali `allowNoProgram`).
 */
export const getSessionContext = cache(async (allowNoProgram = false) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  // Profil belum ada (mis. trigger gagal) → onboarding akan membuatnya lewat upsert.
  const profile: Profile = (data as Profile | null) ?? {
    id: user.id,
    display_name: String(user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Atlet"),
    location_mode: "both",
    focus_muscle: "glutes_lower",
    planned_days: [1, 3, 5],
    weight_step: 1,
    timezone: "Asia/Jakarta",
    program_started_on: null,
  };
  if (!profile.program_started_on && !allowNoProgram) redirect("/onboarding");

  const tz = safeTz(profile.timezone);
  return {
    supabase,
    user,
    profile: { ...profile, weight_step: Number(profile.weight_step) || 1, timezone: tz },
    today: todayLocal(new Date(), tz),
  };
});
