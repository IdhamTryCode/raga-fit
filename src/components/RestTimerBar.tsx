"use client";

import { SkipForward, Timer } from "lucide-react";
import type { useRestTimer } from "@/hooks/useRestTimer";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Bar istirahat mengambang tepat di atas tombol bawah layar latihan.
export default function RestTimerBar({ timer }: { timer: ReturnType<typeof useRestTimer> }) {
  if (timer.remaining <= 0) return null;
  const ending = timer.remaining <= 5;

  return (
    <div
      role="timer"
      aria-live="off"
      className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 px-4 phone-land:left-auto phone-land:w-[58%]"
    >
      <div className="mx-auto flex max-w-[480px] items-center gap-3 rounded-2xl border border-line border-t-2 border-t-warning bg-card px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
        <Timer className={`size-6 shrink-0 ${ending ? "text-primary" : "text-warning"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-ink-secondary">WAKTU ISTIRAHAT</p>
          <p className={`text-2xl font-extrabold leading-tight tabular ${ending ? "text-primary" : "text-white"}`}>
            {fmt(timer.remaining)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => timer.add(15)}
          className="h-12 rounded-xl bg-interactive px-3.5 text-sm font-bold text-ink-secondary active:scale-95"
        >
          +15 dtk
        </button>
        <button
          type="button"
          onClick={timer.stop}
          className="flex h-12 items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-bold text-surface active:scale-95"
        >
          <SkipForward className="size-4" /> Lewati
        </button>
      </div>
    </div>
  );
}
