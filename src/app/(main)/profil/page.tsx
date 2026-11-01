import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import SubmitButton from "@/components/SubmitButton";
import { DAY_SHORT } from "@/lib/date";
import { getSessionContext } from "@/lib/supabase/server";
import { NameForm, WeightStepPicker } from "./ProfileForms";

const LOCATION = { home: "Rumah", gym: "Gym", both: "Rumah & Gym" } as const;
const FOCUS = { glutes_lower: "Bokong & Kaki", back_chest: "Punggung & Dada" } as const;

export default async function ProfilPage() {
  const { user, profile } = await getSessionContext();

  return (
    <main className="px-5 pt-[calc(20px+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-2xl font-extrabold text-primary">
            {profile.display_name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight">{profile.display_name}</h1>
            <p className="truncate text-sm text-ink-secondary">{user.email}</p>
          </div>
        </div>

        <section className="mt-7 space-y-5 rounded-[20px] border border-line bg-card p-4">
          <NameForm name={profile.display_name} />
          <WeightStepPicker step={profile.weight_step} />
        </section>

        <h2 className="mb-3 mt-7 text-lg font-bold">Program</h2>
        <Link href="/onboarding" className="flex items-center gap-3 rounded-[20px] border border-line bg-card p-4 active:scale-[0.99]">
          <div className="min-w-0 flex-1 space-y-1 text-sm">
            <p><span className="text-ink-secondary">Lokasi:</span> <span className="font-semibold">{LOCATION[profile.location_mode]}</span></p>
            <p><span className="text-ink-secondary">Fokus:</span> <span className="font-semibold">{FOCUS[profile.focus_muscle]}</span></p>
            <p>
              <span className="text-ink-secondary">Rencana hari:</span>{" "}
              <span className="font-semibold">{profile.planned_days.map((d) => DAY_SHORT[d - 1]).join(", ")}</span>
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">
            Ubah <ChevronRight className="size-4" />
          </span>
        </Link>

        <form action={signOut} className="mt-7">
          <SubmitButton className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card font-bold text-error">
            <LogOut className="size-5" /> Keluar
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">Raga · v0.2</p>
      </div>
    </main>
  );
}
