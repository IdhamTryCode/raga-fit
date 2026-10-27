"use client";

import { Dumbbell, Home, Repeat2, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocationMode } from "@/data/exercises";
import { generateWeeklySchedule } from "@/lib/scheduleGenerator";
import { todayLocal } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import { PrimaryButton } from "@/components/ui";

type Focus = "glutes_lower" | "back_chest";
type Step = 1 | 2 | 3 | 4;

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;
const ACTIVE_DAYS: Record<number, number[]> = {
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
};

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [locationMode, setLocationMode] = useState<LocationMode | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!daysPerWeek || !locationMode || !focus) return null;
    return generateWeeklySchedule("preview", locationMode, focus, daysPerWeek);
  }, [daysPerWeek, locationMode, focus]);

  const canNext = step === 1 ? locationMode !== null : step === 2 ? daysPerWeek !== null : step === 3 ? focus !== null : true;

  async function startProgram() {
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi berakhir, silakan masuk lagi.");

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          location_mode: locationMode,
          focus_muscle: focus,
          days_per_week: daysPerWeek,
          program_started_on: todayLocal(),
        });
      if (profileError) throw profileError;

      const schedule = generateWeeklySchedule(user.id, locationMode!, focus!, daysPerWeek!);
      const { error: scheduleError } = await supabase
        .from("user_schedules")
        .upsert(schedule, { onConflict: "user_id,day_of_week" });
      if (scheduleError) throw scheduleError;

      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh px-5 pb-6 pt-4">
      <div className="mx-auto w-full max-w-[480px]">
        {/* Progres langkah */}
        <div className="mb-8 flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-interactive"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight">Di mana kamu biasa latihan?</h1>
            <p className="mt-1 text-sm text-ink-secondary">Kami sesuaikan pilihan gerakannya.</p>
            <div className="mt-8 space-y-3">
              <SelectableCard
                icon={<Home className="size-6" />}
                title="Rumah"
                subtitle="Gerakan dengan pita, dumbbell, atau berat badan"
                selected={locationMode === "home"}
                onClick={() => setLocationMode("home")}
              />
              <SelectableCard
                icon={<Dumbbell className="size-6" />}
                title="Gym"
                subtitle="Mesin dan peralatan gym lengkap"
                selected={locationMode === "gym"}
                onClick={() => setLocationMode("gym")}
              />
              <SelectableCard
                icon={<Repeat2 className="size-6" />}
                title="Keduanya"
                subtitle="Kadang di rumah, kadang ke gym"
                selected={locationMode === "both"}
                onClick={() => setLocationMode("both")}
              />
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight">Berapa hari seminggu?</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Pilih jumlah hari yang realistis kamu penuhi.
            </p>
            <div className="mt-8 space-y-3">
              {[3, 4, 5].map((d) => (
                <SelectableCard
                  key={d}
                  icon={<span className="text-xl font-extrabold">{d}</span>}
                  title={`${d} hari per minggu`}
                  subtitle={`Hari aktif: ${ACTIVE_DAYS[d].map((i) => DAY_LABELS[i - 1]).join(", ")}`}
                  selected={daysPerWeek === d}
                  onClick={() => setDaysPerWeek(d)}
                />
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight">Apa fokusmu?</h1>
            <p className="mt-1 text-sm text-ink-secondary">Semua latihan tetap seimbang, ini prioritasnya.</p>
            <div className="mt-8 space-y-3">
              <SelectableCard
                icon={<Zap className="size-6" />}
                title="Bokong & Kaki"
                subtitle="Prioritas otot bawah, core tetap dilatih"
                selected={focus === "glutes_lower"}
                onClick={() => setFocus("glutes_lower")}
              />
              <SelectableCard
                icon={<Dumbbell className="size-6" />}
                title="Punggung & Dada"
                subtitle="Prioritas upper body, core tetap dilatih"
                selected={focus === "back_chest"}
                onClick={() => setFocus("back_chest")}
              />
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight">Ringkasan program</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {locationMode === "home" ? "Rumah" : locationMode === "gym" ? "Gym" : "Keduanya"} ·{" "}
              {daysPerWeek} hari/minggu ·{" "}
              {focus === "glutes_lower" ? "Bokong & Kaki" : "Punggung & Dada"}
            </p>
            <div className="mt-6 space-y-2.5">
              {preview?.map((row) => (
                <div
                  key={row.day_of_week}
                  className={`flex items-center gap-3 rounded-card border border-line bg-card px-4 py-3 ${
                    row.is_rest_day ? "opacity-50" : ""
                  }`}
                >
                  <span className="w-9 text-xs font-semibold text-ink-muted">
                    {DAY_LABELS[row.day_of_week - 1]}
                  </span>
                  {row.is_rest_day ? (
                    <span className="text-sm text-ink-secondary">Istirahat</span>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold">{row.day_title}</p>
                      <p className="text-xs text-ink-muted">
                        {row.exercise_ids.length} gerakan
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {error && (
              <p className="mt-4 rounded-card border border-primary-border bg-primary-soft px-4 py-3 text-sm text-[#ffb3a1]">
                {error}
              </p>
            )}
          </section>
        )}

        <div className="mt-8 flex gap-3 pb-[env(safe-area-inset-bottom)]">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              className="h-14 rounded-card border border-line bg-card px-6 text-base font-semibold text-ink-secondary"
            >
              Kembali
            </button>
          )}
          {step < 4 ? (
            <PrimaryButton
              type="button"
              disabled={!canNext}
              onClick={() => setStep((step + 1) as Step)}
            >
              Lanjut
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={startProgram} disabled={loading}>
              {loading ? "Menyusun program..." : "Mulai Program"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </main>
  );
}

function SelectableCard({
  icon,
  title,
  subtitle,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-card border bg-card px-4 py-4 text-left transition active:scale-[0.99] ${
        selected
          ? "border-primary shadow-[0px_4px_20px_rgba(255,90,44,0.15)]"
          : "border-line"
      }`}
    >
      <span className={selected ? "text-primary" : "text-ink-muted"}>{icon}</span>
      <span>
        <span className="block text-[15px] font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-sm text-ink-secondary">{subtitle}</span>
      </span>
    </button>
  );
}
