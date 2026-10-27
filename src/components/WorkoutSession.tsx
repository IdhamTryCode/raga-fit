"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayLocal } from "@/lib/date";
import { unlockAudio } from "@/lib/audio";
import { useRestTimer } from "@/hooks/useRestTimer";
import { useStopwatch } from "@/hooks/useStopwatch";
import { useWakeLock } from "@/hooks/useWakeLock";
import ExerciseAnimator from "@/components/ExerciseAnimator";
import SetRow from "@/components/SetRow";
import RestTimerBar from "@/components/RestTimerBar";
import StopwatchControl from "@/components/StopwatchControl";

export interface ExerciseData {
  id: string;
  name: string;
  equipment: string;
  metric: "reps" | "duration";
  sets: number;
  target: string;
  defaultValue: number;
  restSeconds: number;
  targetSeconds: number | null;
  tips: string;
}

export type LastLogmap = Record<string, Record<number, { weight: number; reps: number }>>;

interface LogLine {
  weight: number;
  reps: number;
  done: boolean;
}

export default function WorkoutSession({
  dayTitle,
  exercises,
  lastMap,
}: {
  dayTitle: string;
  exercises: ExerciseData[];
  lastMap: LastLogmap;
}) {
  const supabase = createClient();
  const timer = useRestTimer();
  useWakeLock(true);

  const [index, setIndex] = useState(0);
  const [sessionStart] = useState(() => Date.now());
  const [phase, setPhase] = useState<"workout" | "done">("workout");
  const [doneDurationText, setDoneDurationText] = useState("0 dtk");
  const [toast, setToast] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);

  const [logs, setLogs] = useState<Record<string, LogLine[]>>(() =>
    Object.fromEntries(
      exercises.map((ex): [string, LogLine[]] => [
        ex.id,
        Array.from({ length: ex.sets }, (_, i) => ({
          weight: initialWeight(ex, lastMap, i),
          reps: initialReps(ex, lastMap, i),
          done: false,
        })),
      ]),
    ),
  );

  // Stopwatch gerakan durasi: target & detik berjalan di-lift ke level sini.
  const [durationTarget, setDurationTarget] = useState(30);
  const [durationElapsed, setDurationElapsed] = useState(0);

  const current = exercises[index];
  const currentLogs = logs[current.id];

  const totalSets = useMemo(
    () => exercises.reduce((n, ex) => n + (logs[ex.id] ?? []).filter((r) => r.done).length, 0),
    [logs, exercises],
  );
  const totalVolume = useMemo(
    () =>
      exercises.reduce(
        (acc, ex) =>
          ex.metric !== "reps"
            ? acc
            : acc +
              (logs[ex.id] ?? []).filter((r) => r.done).reduce((s, r) => s + r.weight * r.reps, 0),
        0,
      ),
    [logs, exercises],
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function mutateSet(exerciseId: string, setIdx: number, patch: Partial<LogLine>) {
    setLogs((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((r, i) => (i === setIdx ? { ...r, ...patch } : r)),
    }));
  }

  async function toggleSet(ex: ExerciseData, setIdx: number) {
    const row = logs[ex.id][setIdx];

    if (row.done) {
      mutateSet(ex.id, setIdx, { done: false });
      return;
    }

    unlockAudio(); // Wajib di dalam handler tap pertama (syarat iOS).

    const reps =
      ex.metric === "duration"
        ? Math.max(1, Math.round(durationElapsed))
        : row.reps;
    mutateSet(ex.id, setIdx, { reps });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast("Sesi berakhir, silakan masuk lagi.");
      return;
    }

    const { error } = await supabase.from("workout_logs").upsert(
      {
        user_id: user.id,
        workout_date: todayLocal(),
        exercise_id: ex.id,
        set_number: setIdx + 1,
        weight_kg: row.weight,
        reps_or_seconds: reps,
      },
      { onConflict: "user_id,workout_date,exercise_id,set_number" },
    );

    if (error) {
      showToast("Gagal menyimpan, coba lagi.");
      return;
    }

    mutateSet(ex.id, setIdx, { done: true });
    timer.stop();
    timer.start(ex.restSeconds);
  }

  function goNext() {
    if (index === exercises.length - 1) {
      timer.stop();
      const totalSec = Math.max(1, Math.round((Date.now() - sessionStart) / 1000));
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      setDoneDurationText(m > 0 ? `${m} mnt ${s} dtk` : `${s} dtk`);
      setPhase("done");
    } else {
      setIndex(index + 1);
      setTipsOpen(false);
    }
  }

  function activeSetIdx(rows: LogLine[]): number {
    const firstUndone = rows.findIndex((r) => !r.done);
    return firstUndone === -1 ? rows.length - 1 : firstUndone;
  }

  // ── Layar Latihan Selesai ────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-5 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-[480px] flex-col items-center text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-success/15 text-5xl text-success">
            ✓
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Latihan selesai!</h1>
          <p className="mt-1 text-sm text-ink-secondary">{dayTitle}</p>

          <div className="mt-8 grid w-full grid-cols-3 gap-3">
            <SummaryCard label="DURASI" value={doneDurationText} />
            <SummaryCard label="TOTAL SET" value={String(totalSets)} />
            <SummaryCard label="TOTAL BEBAN" value={totalVolume.toLocaleString("id-ID")} unit="kg" />
          </div>

          <Link
            href="/dashboard"
            className="mt-10 flex h-14 w-full items-center justify-center rounded-card bg-primary text-base font-bold text-white active:scale-[0.98]"
          >
            Kembali ke Jadwal
          </Link>
        </div>
      </main>
    );
  }

  // ── Layar Gerakan Aktif ──────────────────────────────────────────────────
  const activeIdx = activeSetIdx(currentLogs);
  const showStopwatch =
    current.metric === "duration" && !currentLogs[activeIdx]?.done;

  return (
    <main className="relative flex min-h-dvh flex-col workout-main">
      {/* Kolom visual */}
      <section className="workout-visual">
        <div className="pt-4">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              aria-label="Kembali ke dashboard"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-card"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-secondary">
                Gerakan {index + 1} dari {exercises.length}
              </p>
              <p className="truncate text-[11px] text-ink-muted">{dayTitle}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-interactive">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((index + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>

        <ExerciseAnimator
          exerciseId={current.id}
          name={current.name}
          className="animator-box mx-auto mt-3 h-52 w-full max-w-[420px]"
        />

        <div className="mt-3">
          <h1 className="text-xl font-bold tracking-tight">{current.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-ink-secondary">
            <span className="rounded-full bg-interactive px-2.5 py-1 text-[10px] font-semibold">
              {current.equipment}
            </span>
            <span className="font-semibold text-primary">
              {current.sets} × {current.target}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setTipsOpen((v) => !v)}
            className="mt-2 flex w-full items-start gap-1 text-left text-xs leading-relaxed text-ink-secondary"
          >
            <span className={`min-w-0 flex-1 ${tipsOpen ? "" : "line-clamp-2"}`}>
              {current.tips}
            </span>
            {tipsOpen ? (
              <ChevronUp className="mt-0.5 size-3.5 shrink-0" />
            ) : (
              <ChevronDown className="mt-0.5 size-3.5 shrink-0" />
            )}
          </button>
        </div>
      </section>

      {/* Kolom kontrol (scroll) */}
      <section className="workout-controls">
        <div className="workout-scroll flex-1 px-5 pt-4 pb-40">
          {currentLogs.map((row, setIdx) => {
            const isActive = setIdx === activeIdx;
            return (
              <div key={setIdx} className="mb-2.5 space-y-1">
                {isActive && !row.done && (
                  <p className="pl-1 text-[11px] text-ink-muted">
                    {lastHint(current, lastMap, setIdx)}
                  </p>
                )}
                <SetRow
                  setNumber={setIdx + 1}
                  weight={row.weight}
                  reps={row.reps}
                  secondUnitLabel={current.metric === "duration" ? "DETIK" : "REP"}
                  completed={row.done}
                  active={isActive}
                  onWeightDelta={(d) =>
                    mutateSet(current.id, setIdx, {
                      weight: Math.max(0, Math.round((row.weight + d) * 2) / 2),
                    })
                  }
                  onRepsDelta={(d) =>
                    mutateSet(current.id, setIdx, { reps: Math.max(0, row.reps + d) })
                  }
                  onToggle={() => toggleSet(current, setIdx)}
                />
              </div>
            );
          })}

          {showStopwatch && (
            <ActiveSetControl
              key={`${current.id}-${activeIdx}`}
              targetSeconds={durationTarget}
              onElapsed={setDurationElapsed}
              onAdjust={(d) =>
                setDurationTarget((t) => Math.max(10, Math.min(600, t + d)))
              }
              onStartFresh={() => setDurationTarget(current.targetSeconds ?? 45)}
            />
          )}
        </div>

        <div className="workout-footer px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={goNext}
            className="h-14 w-full rounded-card bg-primary text-base font-bold text-white transition active:scale-[0.98]"
          >
            {index === exercises.length - 1 ? "Selesai" : "Gerakan Berikutnya"}
          </button>
        </div>
      </section>

      <RestTimerBar timer={timer} />

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-5">
          <div className="rounded-full border border-primary-border bg-card px-4 py-2 text-sm font-semibold shadow-[0px_12px_32px_rgba(0,0,0,0.5)]">
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}

// ── Stopwatch set aktif (gerakan duration) ─────────────────────────────────
// Child terpisah supaya hook useStopwatch di-reset setiap pindah set.
// Saat selesai countdown/jeda, detik berjalan di-lift ke induk.
function ActiveSetControl({
  targetSeconds,
  onElapsed,
  onAdjust,
  onStartFresh,
}: {
  targetSeconds: number;
  onElapsed: (seconds: number) => void;
  onAdjust: (deltaSeconds: number) => void;
  onStartFresh: () => void;
}) {
  const sw = useStopwatch(targetSeconds);

  // Sinkronkan detik berjalan ke induk agar bisa disimpan saat centang.
  useEffect(() => {
    onElapsed(sw.elapsed);
  }, [sw.elapsed, onElapsed]);

  return (
    <div className="mt-2 mb-1 flex flex-col items-center rounded-card border border-line bg-interactive/40 px-4 py-4">
      <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-muted">
        WAKTU GERAKAN
      </p>
      <StopwatchControl
        sw={sw}
        onAdjust={onAdjust}
        onFinishEarly={() => sw.pause()}
      />
      {!sw.running && sw.elapsed === 0 && (
        <button type="button" onClick={onStartFresh} className="mt-1 text-[11px] text-ink-muted">
          Target: {targetSeconds} dtk
        </button>
      )}
    </div>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-card border border-line bg-card px-3 py-4">
      <p className="text-[10px] font-semibold tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold leading-tight">
        {value}
        {unit && <span className="ml-0.5 text-xs text-ink-secondary">{unit}</span>}
      </p>
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────
function initialWeight(ex: ExerciseData, lastMap: LastLogmap, setIdx: number): number {
  const last = lastMap[ex.id]?.[setIdx + 1];
  return last && last.weight > 0 ? last.weight : 0;
}

function initialReps(ex: ExerciseData, lastMap: LastLogmap, setIdx: number): number {
  const last = lastMap[ex.id]?.[setIdx + 1];
  return last?.reps ?? ex.defaultValue;
}

function lastHint(ex: ExerciseData, lastMap: LastLogmap, setIdx: number): string {
  const last = lastMap[ex.id]?.[setIdx + 1];
  if (!last) {
    return ex.metric === "duration"
      ? `Sesi pertama — stopwatch menghitung mundur dari ${ex.targetSeconds ?? 45} dtk.`
      : "Sesi pertama — isi nilai awal lalu centang.";
  }
  return ex.metric === "duration"
    ? `terakhir: ${last.reps} dtk`
    : `terakhir: ${last.weight.toLocaleString("id-ID")} kg × ${last.reps}`;
}
