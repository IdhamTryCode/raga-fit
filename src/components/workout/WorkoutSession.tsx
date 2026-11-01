"use client";

import { ChevronDown, ChevronLeft, CloudOff, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { imageUrl } from "@/data/exercises";
import { unlockAudio } from "@/lib/audio";
import { LETTERS } from "@/lib/program";
import { useRestTimer } from "@/hooks/useRestTimer";
import { useWakeLock } from "@/hooks/useWakeLock";
import ExerciseAnimator from "@/components/ExerciseAnimator";
import RestTimerBar from "@/components/RestTimerBar";
import { abandonSession, finishSession } from "@/app/sesi/actions";
import SetCard from "./SetCard";
import { useSyncQueue } from "./useSyncQueue";

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
export type LastMap = Record<string, Record<number, { weight: number; reps: number }>>;
export interface SavedLog { exerciseId: string; setNumber: number; weight: number; reps: number }
export interface Row { weight: number; reps: number; done: boolean }
type Rows = Record<string, Row[]>;

// Alat tanpa beban tambahan: kolom KG disembunyikan supaya pemula tidak bingung.
const NO_WEIGHT_EQUIPMENT = new Set([
  "Berat badan", "Pita elastis", "Kursi", "Kursi/meja", "Kursi/bangku",
  "Palang", "Palang/meja", "Bola fitness", "Bar paralel",
]);

interface Props {
  sessionId: string;
  userId: string;
  title: string;
  position: number;
  startedAt: string;
  exercises: ExerciseData[];
  saved: SavedLog[];
  lastMap: LastMap;
  weightStep: number;
}

export default function WorkoutSession({ sessionId, userId, title, position, exercises, saved, lastMap, weightStep }: Props) {
  useWakeLock(true);
  const timer = useRestTimer();
  const sync = useSyncQueue(sessionId, userId);
  const draftKey = `raga:sesi:${sessionId}`;

  // Komponen ini hanya dirender di browser (ClientOnly), jadi draf lokal bisa
  // langsung dibaca saat inisialisasi: nilai yang sedang diubah, set yang belum
  // sempat tersimpan, dan posisi gerakan.
  const [initial] = useState(() => restore(draftKey, exercises, saved, lastMap));
  const [rows, setRows] = useState<Rows>(initial.rows);
  const [index, setIndex] = useState(initial.index);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [tipsOpen, setTipsOpen] = useState(false);
  const [sheet, setSheet] = useState<null | "exit" | "finish-empty">(null);
  const [toast, setToast] = useState<string | null>(null);
  const [finishing, startFinish] = useTransition();

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ rows, index }));
    } catch {
      // storage penuh/diblokir
    }
  }, [rows, index, draftKey]);

  // Muat gambar gerakan berikutnya lebih dulu supaya tidak kosong saat pindah.
  useEffect(() => {
    const next = exercises[index + 1];
    if (!next) return;
    [0, 1].forEach((f) => {
      const img = new Image();
      img.src = imageUrl(next.id, f as 0 | 1);
    });
  }, [index, exercises]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2500);
  }, []);

  const current = exercises[index];
  const currentRows = rows[current.id];
  const showWeight =
    current.metric === "reps" &&
    (!NO_WEIGHT_EQUIPMENT.has(current.equipment) || currentRows.some((r) => r.weight > 0));
  const firstUndone = currentRows.findIndex((r) => !r.done);
  const activeIdx = selected[current.id] !== undefined && !currentRows[selected[current.id]]?.done
    ? selected[current.id]
    : firstUndone;

  const doneSets = useMemo(() => Object.values(rows).flat().filter((r) => r.done).length, [rows]);
  const totalSets = useMemo(() => Object.values(rows).flat().length, [rows]);
  const exerciseDone = (ex: ExerciseData) => rows[ex.id].every((r) => r.done);
  const isLast = index === exercises.length - 1;

  function patchRow(exId: string, i: number, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [exId]: prev[exId].map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  }

  function completeSet(ex: ExerciseData, i: number) {
    unlockAudio(); // wajib dalam handler tap pertama (iOS)
    const row = rows[ex.id][i];
    // Set berikutnya ikut nilai set ini bila belum pernah ada riwayat.
    setRows((prev) => ({
      ...prev,
      [ex.id]: prev[ex.id].map((r, j) => {
        if (j === i) return { ...r, done: true };
        if (j > i && !r.done && !lastMap[ex.id]?.[j + 1]) return { ...r, weight: row.weight };
        return r;
      }),
    }));
    setSelected((s) => Object.fromEntries(Object.entries(s).filter(([k]) => k !== ex.id)));
    sync.enqueue({ kind: "upsert", exerciseId: ex.id, setNumber: i + 1, weight: showWeight ? row.weight : 0, reps: row.reps });

    const allDoneAfter = rows[ex.id].every((r, j) => j === i || r.done);
    showToast(allDoneAfter ? `${ex.name} selesai! 💪` : `Set ${i + 1} selesai!`);
    if (!(allDoneAfter && isLast)) timer.start(ex.restSeconds);
  }

  function undoSet(ex: ExerciseData, i: number) {
    patchRow(ex.id, i, { done: false });
    setSelected((s) => ({ ...s, [ex.id]: i }));
    sync.enqueue({ kind: "delete", exerciseId: ex.id, setNumber: i + 1 });
    timer.stop();
  }

  function go(to: number) {
    setIndex(to);
    setTipsOpen(false);
    window.scrollTo({ top: 0 });
  }

  function clearLocal() {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
  }

  function finish() {
    startFinish(async () => {
      const ok = await sync.drain();
      if (!ok) {
        showToast("Masih offline. Set tersimpan di HP, coba lagi saat ada sinyal.");
        return;
      }
      timer.stop();
      clearLocal();
      await finishSession(sessionId);
    });
  }

  function requestFinish() {
    if (doneSets === 0) setSheet("finish-empty");
    else finish();
  }

  function abandon() {
    startFinish(async () => {
      clearLocal();
      await abandonSession(sessionId);
    });
  }

  return (
    <main className="relative flex min-h-dvh flex-col phone-land:grid phone-land:h-dvh phone-land:grid-cols-[5fr_7fr] phone-land:overflow-hidden">
      {/* ── Kolom kiri: header + visual ─────────────────────────────────── */}
      <section className="px-5 pt-[calc(12px+env(safe-area-inset-top))] phone-land:flex phone-land:flex-col phone-land:overflow-y-auto phone-land:pb-4">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSheet("exit")}
            aria-label="Keluar dari latihan"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card"
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-wider text-primary">LATIHAN {LETTERS[position - 1] ?? position}</p>
            <p className="truncate text-[15px] font-bold">{title}</p>
          </div>
          <SyncBadge status={sync.status} pending={sync.pending} />
        </header>

        <div className="mt-4 flex items-center justify-between text-[13px]">
          <span className="font-semibold text-ink-secondary">Gerakan {index + 1} dari {exercises.length}</span>
          <span className="text-ink-muted">{doneSets}/{totalSets} set</span>
        </div>
        <div className="mt-2 flex gap-1">
          {exercises.map((ex, i) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ke gerakan ${i + 1}: ${ex.name}`}
              className="h-3 flex-1 py-1"
            >
              <span
                className={`block h-1.5 rounded-full ${
                  exerciseDone(ex) ? "bg-success" : i === index ? "bg-primary" : "bg-interactive"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] bg-white phone-land:flex-1">
          <ExerciseAnimator
            key={current.id}
            exerciseId={current.id}
            name={current.name}
            className="mx-auto h-56 w-full max-w-[420px] phone-land:h-full phone-land:min-h-32"
          />
        </div>

        <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight">{current.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-card px-3 py-1.5 text-[13px] font-semibold text-ink-secondary">{current.equipment}</span>
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-semibold text-primary">
            Target {current.sets} × {current.target}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setTipsOpen((v) => !v)}
          aria-expanded={tipsOpen}
          className="mt-3 flex w-full items-start gap-2 text-left text-sm leading-relaxed text-ink-secondary"
        >
          <span className={`min-w-0 flex-1 ${tipsOpen ? "" : "line-clamp-2"}`}>{current.tips}</span>
          <ChevronDown className={`mt-0.5 size-4 shrink-0 transition ${tipsOpen ? "rotate-180" : ""}`} />
        </button>
      </section>

      {/* ── Kolom kanan: set + tombol ───────────────────────────────────── */}
      <section className="flex flex-1 flex-col phone-land:h-dvh phone-land:border-l phone-land:border-line">
        <div className="flex-1 space-y-2.5 px-5 pb-6 pt-5 phone-land:overflow-y-auto phone-land:pt-[calc(12px+env(safe-area-inset-top))]">
          {currentRows.map((row, i) => (
            <SetCard
              key={`${current.id}-${i}`}
              ex={current}
              setNumber={i + 1}
              row={row}
              active={i === activeIdx}
              showWeight={showWeight}
              weightStep={weightStep}
              last={lastMap[current.id]?.[i + 1]}
              onChange={(patch) => patchRow(current.id, i, patch)}
              onComplete={() => completeSet(current, i)}
              onUndo={() => undoSet(current, i)}
              onSelect={() => setSelected((s) => ({ ...s, [current.id]: i }))}
            />
          ))}
          {activeIdx === -1 && (
            <p className="pt-1 text-center text-sm font-semibold text-success">
              Semua set selesai. {isLast ? "Saatnya selesaikan latihan!" : "Lanjut ke gerakan berikutnya."}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 z-20 flex gap-2 border-t border-line bg-surface/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          {index > 0 && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Gerakan sebelumnya"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-card"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              onClick={requestFinish}
              disabled={finishing}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-success text-base font-bold text-surface transition active:scale-[0.98] disabled:opacity-60"
            >
              {finishing && <Loader2 className="size-5 animate-spin" />}
              Selesaikan Latihan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className={`h-14 flex-1 rounded-2xl text-base font-bold transition active:scale-[0.98] ${
                exerciseDone(current) ? "bg-primary text-white" : "border border-line bg-card text-white"
              }`}
            >
              {exerciseDone(current) ? "Gerakan Berikutnya" : "Lewati ke Berikutnya"}
            </button>
          )}
        </div>
      </section>

      <RestTimerBar timer={timer} />

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-50 flex justify-center px-5">
          <div className="rounded-full border border-success/50 bg-card px-4 py-2.5 text-sm font-bold shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
            {toast}
          </div>
        </div>
      )}

      {sheet && (
        <Sheet onClose={() => setSheet(null)}>
          {sheet === "exit" ? (
            <>
              <h2 className="text-xl font-extrabold">Keluar dulu?</h2>
              <p className="mt-2 text-sm text-ink-secondary">
                {doneSets > 0
                  ? "Set yang sudah dicentang tetap tersimpan. Lanjutkan kapan saja dari Jadwal."
                  : "Belum ada set yang dicatat. Kamu bisa lanjutkan nanti dari Jadwal."}
              </p>
              <div className="mt-6 space-y-2.5">
                <button type="button" onClick={() => setSheet(null)} className="h-14 w-full rounded-2xl bg-primary font-bold text-white">
                  Lanjut Latihan
                </button>
                <Link href="/dashboard" className="flex h-14 w-full items-center justify-center rounded-2xl border border-line bg-card font-bold">
                  Keluar, lanjutkan nanti
                </Link>
                {doneSets === 0 && (
                  <button type="button" onClick={abandon} disabled={finishing} className="h-12 w-full text-sm font-bold text-error">
                    Batalkan sesi ini
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold">Belum ada set dicatat</h2>
              <p className="mt-2 text-sm text-ink-secondary">Centang minimal satu set supaya latihan ini masuk riwayat.</p>
              <div className="mt-6 space-y-2.5">
                <button type="button" onClick={() => setSheet(null)} className="h-14 w-full rounded-2xl bg-primary font-bold text-white">
                  Kembali Latihan
                </button>
                <button type="button" onClick={abandon} disabled={finishing} className="h-12 w-full text-sm font-bold text-error">
                  Batalkan sesi
                </button>
              </div>
            </>
          )}
        </Sheet>
      )}
    </main>
  );
}

function SyncBadge({ status, pending }: { status: "idle" | "saving" | "offline"; pending: number }) {
  if (status === "offline") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-bold text-warning">
        <CloudOff className="size-3.5" /> {pending} antre
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink-secondary">
      <span className={`size-2 rounded-full ${status === "saving" ? "animate-pulse bg-warning" : "bg-success"}`} />
      {status === "saving" ? "Menyimpan" : "Tersimpan"}
    </span>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 phone-land:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[480px] rounded-t-[24px] border-t border-line bg-card px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6 phone-land:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────
function restore(draftKey: string, exercises: ExerciseData[], saved: SavedLog[], lastMap: LastMap) {
  let rows = buildRows(exercises, saved, lastMap);
  let index = firstIncomplete(exercises, rows);
  try {
    const raw = localStorage.getItem(draftKey);
    if (raw) {
      const draft = JSON.parse(raw) as { rows: Rows; index: number };
      rows = mergeDraft(rows, draft.rows);
      if (Number.isInteger(draft.index)) index = Math.min(Math.max(0, draft.index), exercises.length - 1);
    }
  } catch {
    // draf rusak atau storage diblokir — pakai data server
  }
  return { rows, index };
}

function buildRows(exercises: ExerciseData[], saved: SavedLog[], lastMap: LastMap): Rows {
  return Object.fromEntries(
    exercises.map((ex) => [
      ex.id,
      Array.from({ length: ex.sets }, (_, i): Row => {
        const s = saved.find((l) => l.exerciseId === ex.id && l.setNumber === i + 1);
        if (s) return { weight: s.weight, reps: s.reps, done: true };
        const last = lastMap[ex.id]?.[i + 1] ?? lastMap[ex.id]?.[1];
        return { weight: last?.weight ?? 0, reps: last?.reps ?? ex.defaultValue, done: false };
      }),
    ]),
  );
}

function mergeDraft(base: Rows, draft: Rows): Rows {
  const out: Rows = { ...base };
  for (const [id, list] of Object.entries(base)) {
    const d = draft?.[id];
    if (Array.isArray(d) && d.length === list.length) out[id] = d.map((r) => ({ weight: Number(r.weight) || 0, reps: Number(r.reps) || 0, done: !!r.done }));
  }
  return out;
}

function firstIncomplete(exercises: ExerciseData[], rows: Rows): number {
  const i = exercises.findIndex((ex) => rows[ex.id].some((r) => !r.done));
  return i === -1 ? exercises.length - 1 : i;
}
