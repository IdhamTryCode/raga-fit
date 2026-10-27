"use client";

import { SkipForward } from "lucide-react";
import type { useRestTimer } from "@/hooks/useRestTimer";

// Bar timer istirahat mengambang di atas tombol CTA dan area safe-area bawah.
export default function RestTimerBar({
  timer,
}: {
  timer: ReturnType<typeof useRestTimer>;
}) {
  if (timer.remaining <= 0) return null;

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 mx-5">
      <div className="mx-auto max-w-[480px] rounded-card border border-line border-t-primary bg-card px-4 py-3 shadow-[0px_12px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-ink-muted">WAKTU ISTIRAHAT</p>
            <p className={`text-2xl font-extrabold tabular ${timer.remaining <= 3 ? "text-primary" : "text-white"}`}>
              {fmt(timer.remaining)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => timer.add(15)}
              className="rounded-full bg-interactive px-3 py-2 text-xs font-semibold text-ink-secondary active:bg-interactive/70"
            >
              +15 dtk
            </button>
            <button
              type="button"
              onClick={timer.stop}
              className="flex items-center gap-1 rounded-full bg-interactive px-3 py-2 text-xs font-semibold text-ink active:bg-interactive/70"
            >
              <SkipForward className="size-3" /> Lewati
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
