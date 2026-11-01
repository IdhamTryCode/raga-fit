"use client";

import { ArrowLeft, Check, Dumbbell, Footprints, Home, Repeat2, Shirt } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { LocationMode } from "@/data/exercises";
import { DAY_SHORT } from "@/lib/date";
import { DEFAULT_DAYS, generateProgram, LETTERS, type FocusMuscle } from "@/lib/program";
import { Alert, PrimaryButton } from "@/components/ui";
import { saveProgram } from "./actions";

type Step = 1 | 2 | 3 | 4;

const LOCATION_LABEL: Record<LocationMode, string> = { home: "Rumah", gym: "Gym", both: "Rumah & Gym" };
const FOCUS_LABEL: Record<FocusMuscle, string> = { glutes_lower: "Bokong & Kaki", back_chest: "Punggung & Dada" };

export default function OnboardingFlow({
  editing,
  initial,
}: {
  editing: boolean;
  initial: { locationMode: LocationMode; focus: FocusMuscle; plannedDays: number[] } | null;
}) {
  const [step, setStep] = useState<Step>(1);
  const [locationMode, setLocationMode] = useState<LocationMode | null>(initial?.locationMode ?? null);
  const [days, setDays] = useState<number[]>(initial?.plannedDays ?? DEFAULT_DAYS[3]);
  const [focus, setFocus] = useState<FocusMuscle | null>(initial?.focus ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const program = useMemo(
    () => (locationMode && focus ? generateProgram(locationMode, focus, days.length) : []),
    [locationMode, focus, days.length],
  );

  const daysValid = days.length >= 2 && days.length <= 6;
  const canNext =
    step === 1 ? locationMode !== null : step === 2 ? daysValid : step === 3 ? focus !== null : true;

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  function submit() {
    if (!locationMode || !focus) return;
    setError(null);
    startTransition(async () => {
      const res = await saveProgram({
        locationMode,
        focus,
        plannedDays: days,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <main className="flex min-h-dvh flex-col px-5 pt-[calc(16px+env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        {/* Header: kembali + titik progres */}
        <div className="relative flex h-12 items-center justify-center">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              aria-label="Kembali"
              className="absolute left-0 flex size-12 items-center justify-center rounded-2xl bg-card"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : editing ? (
            <Link
              href="/profil"
              aria-label="Batal"
              className="absolute left-0 flex size-12 items-center justify-center rounded-2xl bg-card"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : null}
          <div className="flex gap-2" aria-label={`Langkah ${step} dari 4`}>
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                className={`size-2.5 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-interactive"}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 flex-1">
          {step === 1 && (
            <Section title="Di mana kamu biasa latihan?" subtitle="Kami sesuaikan pilihan gerakannya.">
              <SelectableCard icon={<Home />} title="Rumah" subtitle="Berat badan, pita elastis, atau dumbbell" selected={locationMode === "home"} onClick={() => setLocationMode("home")} />
              <SelectableCard icon={<Dumbbell />} title="Gym" subtitle="Mesin dan peralatan gym lengkap" selected={locationMode === "gym"} onClick={() => setLocationMode("gym")} />
              <SelectableCard icon={<Repeat2 />} title="Rumah & Gym" subtitle="Kadang di rumah, kadang ke gym" selected={locationMode === "both"} onClick={() => setLocationMode("both")} />
            </Section>
          )}

          {step === 2 && (
            <Section title="Berapa hari seminggu?" subtitle="Pilih jumlahnya, lalu sesuaikan harinya. Ini cuma rencana, kamu tetap bisa latihan hari apa saja.">
              <div className="grid grid-cols-3 gap-3">
                {[3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDays(DEFAULT_DAYS[n])}
                    className={`flex h-24 flex-col items-center justify-center rounded-2xl transition active:scale-[0.98] ${
                      days.length === n ? "bg-primary text-white" : "bg-card text-white"
                    }`}
                  >
                    <span className="text-3xl font-extrabold">{n}</span>
                    <span className={`text-sm ${days.length === n ? "text-white/90" : "text-ink-secondary"}`}>hari</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold tracking-wider text-ink-secondary">PILIH HARINYA</p>
                  <p className={`text-xs font-bold ${daysValid ? "text-primary" : "text-error"}`}>
                    {days.length} hari aktif
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_SHORT.map((label, i) => {
                    const d = i + 1;
                    const on = days.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        aria-pressed={on}
                        className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition ${
                          on ? "bg-primary text-white" : "bg-interactive text-ink-muted"
                        }`}
                      >
                        {label}
                        <span className={`size-1.5 rounded-full ${on ? "bg-white" : "bg-transparent"}`} />
                      </button>
                    );
                  })}
                </div>
                {!daysValid && <p className="mt-3 text-[13px] text-error">Pilih antara 2 sampai 6 hari.</p>}
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Apa fokusmu?" subtitle="Semua latihan tetap seimbang, ini prioritasnya.">
              <SelectableCard icon={<Footprints />} title="Bokong & Kaki" subtitle="Prioritas otot bawah, core tetap dilatih" selected={focus === "glutes_lower"} onClick={() => setFocus("glutes_lower")} />
              <SelectableCard icon={<Shirt />} title="Punggung & Dada" subtitle="Prioritas tubuh atas, core tetap dilatih" selected={focus === "back_chest"} onClick={() => setFocus("back_chest")} />
            </Section>
          )}

          {step === 4 && locationMode && focus && (
            <Section title="Programmu siap" subtitle={`${LOCATION_LABEL[locationMode]} · ${days.length} hari/minggu · ${FOCUS_LABEL[focus]}`}>
              <div className="rounded-2xl bg-card p-4">
                <p className="text-xs font-bold tracking-wider text-ink-secondary">RENCANA HARI</p>
                <p className="mt-1 text-base font-semibold">{days.map((d) => DAY_SHORT[d - 1]).join(" · ")}</p>
              </div>
              <p className="pt-2 text-sm text-ink-secondary">
                Latihan dikerjakan berurutan. Setelah {LETTERS[program.length - 1]}, kembali ke A.
              </p>
              {program.map((w) => (
                <div key={w.position} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-base font-extrabold text-primary">
                    {LETTERS[w.position - 1]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{w.title}</p>
                    <p className="text-[13px] text-ink-muted">{w.exercise_ids.length} gerakan</p>
                  </div>
                </div>
              ))}
              {editing && (
                <p className="text-[13px] text-ink-muted">Riwayat latihanmu tetap tersimpan.</p>
              )}
              {error && <Alert>{error}</Alert>}
            </Section>
          )}
        </div>

        <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-surface via-surface to-transparent px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6">
          {step < 4 ? (
            <PrimaryButton type="button" disabled={!canNext} onClick={() => setStep((step + 1) as Step)}>
              Lanjut
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={submit} loading={pending}>
              {pending ? "Menyusun program..." : editing ? "Simpan Program" : "Mulai Program"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </main>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
      <p className="mt-2 text-[15px] text-ink-secondary">{subtitle}</p>
      <div className="mt-7 space-y-3">{children}</div>
    </section>
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
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-2xl border-[1.5px] bg-card px-4 py-4 text-left transition active:scale-[0.99] ${
        selected ? "border-primary shadow-[0_4px_20px_rgba(255,90,44,0.15)]" : "border-line"
      }`}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl [&>svg]:size-6 ${
          selected ? "bg-primary-soft text-primary" : "bg-interactive text-ink-secondary"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-white">{title}</span>
        <span className="mt-0.5 block text-sm text-ink-secondary">{subtitle}</span>
      </span>
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-primary bg-primary text-white" : "border-line"
        }`}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  );
}
