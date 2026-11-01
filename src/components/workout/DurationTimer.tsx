"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStopwatch } from "@/hooks/useStopwatch";
import { unlockAudio } from "@/lib/audio";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Hitung mundur untuk gerakan durasi (Plank, Dead Bug, ...).
// Mulai dari target gerakan; hasil (penuh atau dijeda lebih awal) dikirim lewat onResult
// sehingga kolom DETIK terisi otomatis — tetap bisa dikoreksi manual.
export default function DurationTimer({
  initialTarget,
  onResult,
}: {
  initialTarget: number;
  onResult: (seconds: number) => void;
}) {
  const [target, setTarget] = useState(initialTarget);
  const sw = useStopwatch(target);
  const finished = sw.elapsed >= target && sw.elapsed > 0;
  const reported = useRef(false);

  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true;
      onResult(target);
    }
  }, [finished, target, onResult]);

  const pct = Math.min(100, (sw.elapsed / target) * 100);

  return (
    <div className="rounded-2xl bg-surface/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-wider text-ink-secondary">TIMER GERAKAN</p>
        {!sw.running && sw.elapsed === 0 && (
          <div className="flex items-center gap-1.5">
            {[-5, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setTarget((t) => Math.max(10, Math.min(600, t + d)))}
                className="h-9 rounded-full bg-interactive px-3 text-xs font-bold text-ink-secondary active:scale-95"
              >
                {d > 0 ? `+${d}` : d} dtk
              </button>
            ))}
          </div>
        )}
      </div>

      <p className={`mt-2 text-center text-5xl font-extrabold tabular tracking-tight ${finished ? "text-success" : sw.running ? "text-white" : "text-ink-secondary"}`}>
        {fmt(sw.remaining)}
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-interactive">
        <div className={`h-full rounded-full transition-[width] duration-300 ${finished ? "bg-success" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 flex gap-2">
        {finished ? (
          <button
            type="button"
            onClick={() => {
              reported.current = false;
              sw.reset();
            }}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-interactive font-bold"
          >
            <RotateCcw className="size-4" /> Ulangi
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              unlockAudio(); // wajib di dalam tap (iOS)
              if (sw.running) sw.pause();
              else sw.start();
            }}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-bold active:scale-[0.98] ${
              sw.running ? "bg-interactive text-white" : "bg-white text-surface"
            }`}
          >
            {sw.running ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            {sw.running ? "Jeda" : sw.elapsed > 0 ? "Lanjut" : "Mulai Timer"}
          </button>
        )}
        {!sw.running && !finished && sw.elapsed > 0 && (
          <button
            type="button"
            onClick={() => onResult(Math.max(1, Math.floor(sw.elapsed)))}
            className="h-12 flex-1 rounded-2xl border border-primary text-sm font-bold text-primary"
          >
            Pakai {Math.floor(sw.elapsed)} dtk
          </button>
        )}
      </div>
    </div>
  );
}
