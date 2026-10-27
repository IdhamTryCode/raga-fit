"use client";

import { Check, Minus, Plus } from "lucide-react";

interface SetRowProps {
  setNumber: number;
  weight: number;
  reps: number;
  secondUnitLabel: string; // "REP" atau "DETIK"
  completed: boolean;
  active: boolean;
  onWeightDelta: (delta: number) => void;
  onRepsDelta: (delta: number) => void;
  onToggle: () => void;
}

export default function SetRow({
  setNumber,
  weight,
  reps,
  secondUnitLabel,
  completed,
  active,
  onWeightDelta,
  onRepsDelta,
  onToggle,
}: SetRowProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-card border px-3 py-3 transition-colors ${
        completed
          ? "border-success/40 bg-success/5"
          : active
            ? "border-primary bg-card"
            : "border-line bg-card"
      }`}
    >
      <span
        className={`w-6 shrink-0 text-center text-sm font-bold ${
          completed ? "text-success" : "text-ink-secondary"
        }`}
      >
        {setNumber}
      </span>

      <Stepper
        label="KG"
        value={weight}
        step={weight === 0 ? 0.5 : 1}
        display={weight === 0 ? "0" : weight.toLocaleString("id-ID")}
        hint="0 = badan"
        onDelta={onWeightDelta}
        accent={completed ? "text-ink-muted" : undefined}
      />

      <Stepper
        label={secondUnitLabel}
        value={reps}
        step={1}
        display={String(reps)}
        onDelta={onRepsDelta}
        accent={completed ? "text-ink-muted" : undefined}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={completed ? `Batalkan set ${setNumber}` : `Tandai set ${setNumber} selesai`}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
          completed
            ? "border-success bg-success text-white"
            : active
              ? "border-primary text-primary"
              : "border-line text-transparent"
        }`}
      >
        <Check className="size-5" strokeWidth={3} />
      </button>
    </div>
  );
}

function Stepper({
  label,
  value,
  step,
  display,
  hint,
  onDelta,
  accent,
}: {
  label: string;
  value: number;
  step: number;
  display: string;
  hint?: string;
  onDelta: (delta: number) => void;
  accent?: string;
}) {
  return (
    <div className={`flex min-w-[108px] flex-1 flex-col items-center ${accent ?? ""}`}>
      <span className="text-[10px] font-semibold tracking-wider text-ink-muted">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onDelta(-step)}
          aria-label={`Kurangi ${label}`}
          className="flex size-9 items-center justify-center rounded-xl bg-interactive text-ink-secondary active:bg-interactive/70"
        >
          <Minus className="size-4" strokeWidth={2.5} />
        </button>
        <span className={`w-12 text-center text-2xl font-bold tabular ${accent ? "opacity-60" : ""}`}>
          {display}
        </span>
        <button
          type="button"
          onClick={() => onDelta(step)}
          aria-label={`Tambah ${label}`}
          className="flex size-9 items-center justify-center rounded-xl bg-interactive text-ink active:bg-interactive/70"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </button>
      </div>
      {hint && value === 0 && (
        <span className="text-[10px] text-ink-muted">{hint}</span>
      )}
    </div>
  );
}
