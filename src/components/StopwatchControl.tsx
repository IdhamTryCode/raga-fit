"use client";

import { useStopwatch } from "@/hooks/useStopwatch";

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Kontrol hitung mundur untuk gerakan metric "duration".
// Selesai (atau "Selesai Lebih Awal") mengisi detik terpakai otomatis di set aktif.
export default function StopwatchControl({
  sw,
  onAdjust,
  onFinishEarly,
}: {
  sw: ReturnType<typeof useStopwatch>;
  onAdjust: (deltaSeconds: number) => void;
  onFinishEarly: () => void;
}) {
  const finished = sw.remaining === 0 && sw.elapsed > 0;

  const label = sw.running ? "Jeda" : finished ? "Reset" : sw.elapsed > 0 ? "Lanjut" : "Mulai";
  const onMain = () => {
    if (sw.running) sw.pause();
    else if (finished) sw.reset();
    else sw.start();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p
        className={`text-4xl font-extrabold tabular ${
          sw.running ? "text-white" : finished ? "text-success" : "text-ink-secondary"
        }`}
      >
        {fmt(sw.remaining)}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMain}
          className="flex h-12 min-w-[110px] items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-white active:scale-[0.98]"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-5)}
          aria-label="Kurangi 5 detik"
          className="flex size-12 items-center justify-center rounded-full bg-interactive text-sm font-bold text-ink-secondary active:bg-interactive/70"
        >
          -5
        </button>
        <button
          type="button"
          onClick={() => onAdjust(+5)}
          aria-label="Tambah 5 detik"
          className="flex size-12 items-center justify-center rounded-full bg-interactive text-sm font-bold text-ink-secondary active:bg-interactive/70"
        >
          +5
        </button>
      </div>
      {!sw.running && !finished && sw.elapsed > 0 && (
        <button
          type="button"
          onClick={onFinishEarly}
          className="text-xs font-semibold text-primary"
        >
          Selesai lebih awal — pakai {Math.floor(sw.elapsed)} dtk
        </button>
      )}
    </div>
  );
}
