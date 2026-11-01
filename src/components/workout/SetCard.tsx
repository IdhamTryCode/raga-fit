"use client";

import { Check } from "lucide-react";
import { formatWeight, parseCount, parseWeight, stepWeight } from "@/lib/weight";
import DurationTimer from "./DurationTimer";
import NumberStepper from "./NumberStepper";
import type { ExerciseData, Row } from "./WorkoutSession";

interface Props {
  ex: ExerciseData;
  setNumber: number;
  row: Row;
  active: boolean;
  showWeight: boolean;
  weightStep: number;
  last?: { weight: number; reps: number };
  onChange: (patch: Partial<Row>) => void;
  onComplete: () => void;
  onUndo: () => void;
  onSelect: () => void;
}

export default function SetCard({ ex, setNumber, row, active, showWeight, weightStep, last, onChange, onComplete, onUndo, onSelect }: Props) {
  const isDuration = ex.metric === "duration";
  const summary = isDuration
    ? `${row.reps} dtk`
    : showWeight
      ? `${formatWeight(row.weight)} kg × ${row.reps}`
      : `${row.reps} rep`;
  const lastText = last
    ? isDuration
      ? `${last.reps} dtk`
      : showWeight
        ? `${formatWeight(last.weight)} kg × ${last.reps}`
        : `${last.reps} rep`
    : null;

  // ── Set selesai: baris ringkas, ketuk centang untuk membatalkan ──
  if (row.done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/[0.07] px-4 py-3">
        <span className="w-12 text-sm font-bold text-success">Set {setNumber}</span>
        <span className="flex-1 text-lg font-bold tabular text-white/60">{summary}</span>
        <button
          type="button"
          onClick={onUndo}
          aria-label={`Batalkan set ${setNumber}`}
          className="flex size-12 items-center justify-center rounded-full bg-success text-surface transition active:scale-95"
        >
          <Check className="size-6" strokeWidth={3} />
        </button>
      </div>
    );
  }

  // ── Set belum dikerjakan & tidak aktif: ketuk untuk memilih ──
  if (!active) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <span className="w-12 text-sm font-bold text-ink-muted">Set {setNumber}</span>
        <span className="flex-1 text-lg font-bold tabular text-ink-muted">{summary}</span>
        <span className="flex size-12 items-center justify-center rounded-full border-2 border-line" />
      </button>
    );
  }

  // ── Set aktif: kontrol lengkap ──
  return (
    <div className="rounded-[20px] border-[1.5px] border-primary bg-card p-3 shadow-[0_4px_20px_rgba(255,90,44,0.15)]">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-base font-extrabold text-primary">
          Set {setNumber} <span className="ml-1 text-[11px] font-bold tracking-wider">AKTIF</span>
        </p>
        <p className="text-[13px] text-ink-secondary">
          {lastText ? <>Lalu: <span className="font-semibold text-white">{lastText}</span></> : "Sesi pertama"}
        </p>
      </div>

      <div className="space-y-2">
        {showWeight && (
          <NumberStepper
            label="BEBAN (KG)"
            value={row.weight}
            display={formatWeight(row.weight)}
            sub={row.weight === 0 ? "0 = tanpa beban" : undefined}
            decimal
            parse={parseWeight}
            onStep={(dir) => onChange({ weight: stepWeight(row.weight, dir, weightStep) })}
            onCommit={(weight) => onChange({ weight })}
          />
        )}

        {isDuration && (
          <DurationTimer
            initialTarget={ex.targetSeconds ?? ex.defaultValue}
            onResult={(reps) => onChange({ reps })}
          />
        )}

        <NumberStepper
          label={isDuration ? "DURASI (DETIK)" : "REPETISI"}
          value={row.reps}
          display={String(row.reps)}
          sub={`Target ${ex.target}`}
          parse={parseCount}
          onStep={(dir) => onChange({ reps: Math.max(0, row.reps + dir * (isDuration ? 5 : 1)) })}
          onCommit={(reps) => onChange({ reps })}
        />
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={row.reps <= 0}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-[0_8px_24px_rgba(255,90,44,0.3)] transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        <Check className="size-5" strokeWidth={3} /> Selesaikan Set {setNumber}
      </button>
    </div>
  );
}
