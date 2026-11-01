"use client";

import { Check, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_TEMPO,
  READY_MS,
  TEMPOS,
  fmtClock,
  nextPending,
  readyCount,
  restRemaining,
  workCount,
  workDone,
  type Pos,
} from "@/lib/guided";
import { cue, hasIndonesianVoice, stopSpeaking } from "@/lib/voice";
import { formatWeight, stepWeight } from "@/lib/weight";
import ExerciseAnimator from "@/components/ExerciseAnimator";
import type { ExerciseData, Row } from "./WorkoutSession";

type Phase =
  | { kind: "ready"; at: Pos }
  | { kind: "work"; at: Pos; target: number; tempoMs: number }
  | { kind: "rest"; at: Pos; total: number; next: Pos }
  | { kind: "done" };

interface Props {
  exercises: ExerciseData[];
  rows: Record<string, Row[]>;
  start: Pos;
  weightStep: number;
  audio: boolean;
  showWeight: (ex: ExerciseData) => boolean;
  onAudioChange: (on: boolean) => void;
  onSetDone: (pos: Pos, reps: number) => void;
  onAdjustReps: (pos: Pos, reps: number) => void;
  onWeight: (pos: Pos, weight: number) => void;
  onPosition: (exIndex: number) => void;
  onFinishWorkout: () => void;
  onClose: () => void;
}

const TEMPO_KEY = "raga:tempo";
const RING = 2 * Math.PI * 90;

export default function GuidedRunner(props: Props) {
  const { exercises, rows, weightStep, audio } = props;
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  const [tempo, setTempo] = useState<number>(() => {
    try {
      const t = Number(localStorage.getItem(TEMPO_KEY));
      return (TEMPOS as readonly number[]).includes(t) ? t : DEFAULT_TEMPO;
    } catch {
      return DEFAULT_TEMPO;
    }
  });
  const [phase, setPhase] = useState<Phase>({ kind: "ready", at: props.start });
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceOk, setVoiceOk] = useState(true);

  // Waktu fase berbasis timestamp (akurat walau tab sempat tertidur).
  const phaseStart = useRef(0);
  useEffect(() => {
    phaseStart.current = Date.now(); // hitung mundur "siap" dimulai saat layar muncul
  }, []);
  const pausedTotal = useRef(0);
  const pausedAt = useRef<number | null>(null);
  const lastSaid = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const tempoRef = useRef(tempo);
  useEffect(() => {
    tempoRef.current = tempo;
    try {
      localStorage.setItem(TEMPO_KEY, String(tempo));
    } catch {}
  }, [tempo]);

  const say = useCallback((text: string, freq = 880) => {
    if (latest.current.audio) cue(text, freq);
  }, []);

  const enter = useCallback((p: Phase) => {
    phaseRef.current = p;
    phaseStart.current = Date.now();
    pausedTotal.current = 0;
    lastSaid.current = null;
    setElapsed(0);
    setPhase(p);
  }, []);


  const beginWork = useCallback(
    (at: Pos) => {
      const { exercises: exs, rows: rs, onPosition } = latest.current;
      const ex = exs[at.ex];
      const planned = rs[ex.id][at.set]?.reps || ex.defaultValue;
      const isDuration = ex.metric === "duration";
      onPosition(at.ex);
      navigator.vibrate?.(120);
      enter({ kind: "work", at, target: Math.max(1, planned), tempoMs: isDuration ? 1000 : tempoRef.current * 1000 });
    },
    [enter],
  );

  const finishWork = useCallback(
    (at: Pos, reps: number) => {
      const { exercises: exs, rows: rs, onSetDone } = latest.current;
      onSetDone(at, reps);
      const done = exs.map((e, ei) => rs[e.id].map((r, si) => r.done || (ei === at.ex && si === at.set)));
      const next = nextPending(done, at);
      navigator.vibrate?.([80, 60, 80]);
      if (!next) {
        enter({ kind: "done" });
        say("Latihan selesai. Kerja bagus!", 1200);
        return;
      }
      const ex = exs[at.ex];
      enter({ kind: "rest", at, total: ex.restSeconds, next });
      say(next.ex !== at.ex ? `Istirahat. Berikutnya, ${exs[next.ex].name}` : "Istirahat", 600);
    },
    [enter, say],
  );

  // Detak utama: 10x per detik, semua transisi fase terjadi di sini.
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedAt.current !== null) return;
      const p = phaseRef.current;
      const el = Date.now() - phaseStart.current - pausedTotal.current;
      setElapsed(el);

      if (p.kind === "ready") {
        const c = readyCount(el);
        if (c !== lastSaid.current && c > 0) {
          lastSaid.current = c;
          say(String(c), 660);
        }
        if (el >= READY_MS) {
          say("Mulai!", 1100);
          beginWork(p.at);
        }
      } else if (p.kind === "work") {
        const c = workCount(el, p.tempoMs, p.target);
        if (c > 0 && c !== lastSaid.current) {
          lastSaid.current = c;
          say(String(c), c === p.target ? 1100 : 880);
          navigator.vibrate?.(25);
        }
        if (workDone(el, p.tempoMs, p.target)) finishWork(p.at, p.target);
      } else if (p.kind === "rest") {
        const r = restRemaining(el, p.total);
        if (r <= 5 && r > 0 && r !== lastSaid.current) {
          lastSaid.current = r;
          say(String(r), 660);
        }
        if (r === 0) {
          say("Mulai!", 1100);
          beginWork(p.next);
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [beginWork, finishWork, say]);

  // Suara Indonesia tersedia? Daftar suara dimuat asinkron.
  useEffect(() => {
    const check = () => setVoiceOk(hasIndonesianVoice());
    const t = setTimeout(check, 400);
    window.speechSynthesis?.addEventListener?.("voiceschanged", check);
    return () => {
      clearTimeout(t);
      window.speechSynthesis?.removeEventListener?.("voiceschanged", check);
      stopSpeaking();
    };
  }, []);

  function togglePause() {
    if (pausedAt.current === null) {
      pausedAt.current = Date.now();
      setPaused(true);
      stopSpeaking();
    } else {
      pausedTotal.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
      setPaused(false);
    }
  }

  function restartSet() {
    lastSaid.current = null;
    phaseStart.current = Date.now();
    pausedTotal.current = 0;
    if (pausedAt.current !== null) pausedAt.current = Date.now();
    setElapsed(0);
  }

  function resumeIfPaused() {
    if (pausedAt.current !== null) togglePause();
  }


  // ── Tampilan per fase ──────────────────────────────────────────────────
  let ringColor = "var(--color-primary)";
  let progress = 0;
  let center: React.ReactNode = null;
  let below: React.ReactNode = null;
  let controls: React.ReactNode = null;
  let title = "";
  let setInfo: Pos | null = null;

  const pauseBtn = (
    <button
      type="button"
      onClick={togglePause}
      aria-label={paused ? "Lanjutkan" : "Jeda"}
      className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white text-surface short:size-16 shadow-[0_8px_30px_rgba(255,255,255,0.15)] transition active:scale-95"
    >
      {paused ? <Play className="ml-1 size-9 fill-current" /> : <Pause className="size-9 fill-current" />}
    </button>
  );
  const sideBtn = "flex h-14 min-w-24 flex-1 flex-col phone-land:min-w-0 items-center justify-center gap-0.5 rounded-2xl bg-card px-3 text-xs font-bold text-ink-secondary transition active:scale-95";

  if (phase.kind === "ready") {
    const ex = exercises[phase.at.ex];
    title = ex.name;
    setInfo = phase.at;
    ringColor = "#ffffff";
    progress = Math.min(1, elapsed / READY_MS);
    const c = readyCount(elapsed);
    center = (
      <>
        <p className="text-sm font-bold tracking-widest text-ink-secondary">SIAP</p>
        <p className="text-[112px] font-extrabold leading-none tabular short:text-[88px] phone-land:text-[80px]">{c || "GO"}</p>
      </>
    );
    below = <TempoPicker ex={ex} tempo={tempo} onChange={setTempo} />;
    controls = (
      <>
        <button type="button" className={sideBtn} onClick={() => props.onClose()}>
          <X className="size-5" /> Batal
        </button>
        {pauseBtn}
        <button type="button" className={sideBtn} onClick={() => { resumeIfPaused(); say("Mulai!", 1100); beginWork(phase.at); }}>
          <SkipForward className="size-5" /> Langsung
        </button>
      </>
    );
  } else if (phase.kind === "work") {
    const ex = exercises[phase.at.ex];
    const row = rows[ex.id][phase.at.set];
    const count = workCount(elapsed, phase.tempoMs, phase.target);
    const isDuration = ex.metric === "duration";
    title = ex.name;
    setInfo = phase.at;
    progress = Math.min(1, elapsed / (phase.target * phase.tempoMs));
    center = (
      <>
        <p className="text-sm font-bold tracking-widest text-primary">{isDuration ? "TAHAN" : "REPETISI"}</p>
        <p key={count} className="animate-[pop_.25s_ease-out] text-[120px] font-extrabold leading-none tabular short:text-[96px] phone-land:text-[88px]">{count}</p>
        <p className="mt-1 text-base font-semibold text-ink-secondary">dari {phase.target} {isDuration ? "dtk" : "rep"}</p>
      </>
    );
    below = props.showWeight(ex) ? (
      <div className="flex items-center justify-center gap-3">
        <button type="button" aria-label="Kurangi beban" onClick={() => props.onWeight(phase.at, stepWeight(row.weight, -1, weightStep))} className="flex size-12 items-center justify-center rounded-2xl bg-card active:scale-95">
          <Minus className="size-5" />
        </button>
        <div className="min-w-28 text-center">
          <p className="text-[11px] font-bold tracking-wider text-ink-muted">BEBAN</p>
          <p className="text-2xl font-extrabold tabular">{formatWeight(row.weight)} <span className="text-sm text-ink-secondary">kg</span></p>
        </div>
        <button type="button" aria-label="Tambah beban" onClick={() => props.onWeight(phase.at, stepWeight(row.weight, 1, weightStep))} className="flex size-12 items-center justify-center rounded-2xl bg-card active:scale-95">
          <Plus className="size-5" />
        </button>
      </div>
    ) : (
      <p className="text-center text-sm text-ink-muted">{isDuration ? "Tahan posisi, napas teratur." : `Tempo ${phase.tempoMs / 1000} dtk per rep. Gerak pelan & terkontrol.`}</p>
    );
    controls = (
      <>
        <button type="button" className={sideBtn} onClick={restartSet}>
          <RotateCcw className="size-5" /> Ulang
        </button>
        {pauseBtn}
        <button type="button" className={sideBtn} onClick={() => { resumeIfPaused(); finishWork(phase.at, Math.max(1, count)); }}>
          <Check className="size-5" /> Selesai set
        </button>
      </>
    );
  } else if (phase.kind === "rest") {
    const ex = exercises[phase.at.ex];
    const nextEx = exercises[phase.next.ex];
    const remaining = restRemaining(elapsed, phase.total);
    const loggedReps = rows[ex.id][phase.at.set]?.reps ?? 0;
    title = phase.next.ex !== phase.at.ex ? `Berikutnya: ${nextEx.name}` : ex.name;
    setInfo = phase.next;
    ringColor = "var(--color-warning)";
    progress = remaining / phase.total;
    center = (
      <>
        <p className="text-sm font-bold tracking-widest text-warning">ISTIRAHAT</p>
        <p className="text-[64px] font-extrabold leading-none tracking-tight tabular text-warning phone-land:text-[52px]">{fmtClock(remaining)}</p>
        <p className="mt-2 text-base font-semibold text-ink-secondary">
          Berikutnya set {phase.next.set + 1} · {rows[nextEx.id][phase.next.set]?.reps} {nextEx.metric === "duration" ? "dtk" : "rep"}
        </p>
      </>
    );
    below = (
      <div className="mx-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-card px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-surface">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="text-ink-secondary">Set {phase.at.set + 1} tercatat</span>
          <br />
          <span className="text-lg font-extrabold tabular">{loggedReps} {ex.metric === "duration" ? "dtk" : "rep"}</span>
        </p>
        <button type="button" aria-label="Kurangi repetisi tercatat" onClick={() => props.onAdjustReps(phase.at, Math.max(1, loggedReps - 1))} className="flex size-11 items-center justify-center rounded-xl bg-interactive active:scale-95">
          <Minus className="size-4" />
        </button>
        <button type="button" aria-label="Tambah repetisi tercatat" onClick={() => props.onAdjustReps(phase.at, loggedReps + 1)} className="flex size-11 items-center justify-center rounded-xl bg-interactive active:scale-95">
          <Plus className="size-4" />
        </button>
      </div>
    );
    controls = (
      <>
        <button type="button" className={sideBtn} onClick={() => { const p = phaseRef.current; if (p.kind === "rest") { const np = { ...p, total: p.total + 15 }; phaseRef.current = np; setPhase(np); } }}>
          <Plus className="size-5" /> 15 dtk
        </button>
        {pauseBtn}
        <button type="button" className={sideBtn} onClick={() => { resumeIfPaused(); say("Mulai!", 1100); beginWork(phase.next); }}>
          <SkipForward className="size-5" /> Lewati
        </button>
      </>
    );
  } else {
    title = "Semua gerakan selesai";
    ringColor = "var(--color-success)";
    progress = 1;
    center = (
      <>
        <Check className="size-24 text-success" strokeWidth={3} />
        <p className="mt-2 text-2xl font-extrabold">Kerja bagus!</p>
      </>
    );
    controls = (
      <div className="w-full space-y-2.5">
        <button type="button" onClick={props.onFinishWorkout} className="h-14 w-full rounded-2xl bg-success text-base font-bold text-surface active:scale-[0.98]">
          Selesaikan Latihan
        </button>
        <button type="button" onClick={props.onClose} className="h-12 w-full rounded-2xl text-sm font-bold text-ink-secondary">
          Kembali ke daftar set
        </button>
      </div>
    );
  }

  const ex = setInfo ? exercises[setInfo.ex] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <button type="button" onClick={props.onClose} aria-label="Tutup mode timer" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card">
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-wider text-primary">MODE TIMER</p>
          <p className="truncate text-[15px] font-bold">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => props.onAudioChange(!audio)}
          aria-pressed={audio}
          className={`flex h-12 items-center gap-1.5 rounded-2xl px-3.5 text-xs font-bold ${audio ? "bg-primary-soft text-primary" : "bg-card text-ink-muted"}`}
        >
          {audio ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          Suara
        </button>
      </header>
      {audio && !voiceOk && (
        <p className="mt-2 text-center text-[12px] text-ink-muted">Suara Bahasa Indonesia tidak ada di perangkat ini, pakai bunyi beep.</p>
      )}

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 short:gap-3 phone-land:flex-row phone-land:gap-6">
        {/* Contoh gerakan: saat istirahat menampilkan gerakan berikutnya */}
        {ex && (
          <div className="relative w-full max-w-sm shrink-0 overflow-hidden rounded-[20px] bg-white phone-land:w-[25%] phone-land:max-w-[240px]">
            <ExerciseAnimator
              key={ex.id}
              exerciseId={ex.id}
              name={ex.name}
              className="h-[20dvh] min-h-24 w-full short:h-[17dvh] phone-land:h-[50dvh]"
            />
            {phase.kind === "rest" && (
              <span className="absolute left-2.5 top-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-warning">
                BERIKUTNYA{phase.next.ex !== phase.at.ex ? ` · ${ex.name}` : ""}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col items-center">
          {ex && setInfo && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-bold text-ink-secondary">Set {setInfo.set + 1} dari {rows[ex.id].length}</span>
              <span className="flex gap-1">
                {rows[ex.id].map((r, i) => (
                  <span key={i} className={`h-2 w-5 rounded-full ${r.done ? "bg-success" : i === setInfo!.set ? "bg-primary" : "bg-interactive"}`} />
                ))}
              </span>
            </div>
          )}
          <div className="relative size-[min(68vw,34dvh,290px)] min-h-48 min-w-48 short:size-[min(60vw,30dvh)] phone-land:size-[min(58dvh,230px)] phone-land:min-h-0 phone-land:min-w-0">
            <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
              <circle cx="100" cy="100" r="90" fill="none" stroke="var(--color-interactive)" strokeWidth="10" />
              <circle
                cx="100" cy="100" r="90" fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={RING} strokeDashoffset={RING * (1 - progress)}
                style={{ transition: "stroke-dashoffset 120ms linear, stroke 300ms" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="off">
              {center}
            </div>
            {paused && (
              <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                <span className="rounded-full bg-card px-3 py-1 text-xs font-bold text-ink-secondary">DIJEDA</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-6 short:gap-3 phone-land:w-[300px] phone-land:max-w-[36%] phone-land:shrink-0">
          {below}
          <div className="flex items-center justify-between gap-3">{controls}</div>
        </div>
      </div>
    </div>
  );
}

function TempoPicker({ ex, tempo, onChange }: { ex: ExerciseData; tempo: number; onChange: (t: number) => void }) {
  if (ex.metric === "duration") {
    return <p className="text-center text-sm text-ink-muted">Hitungan per detik. Tahan posisi sampai selesai.</p>;
  }
  return (
    <div>
      <p className="mb-2 text-center text-xs font-bold tracking-wider text-ink-muted">TEMPO PER REP</p>
      <div className="mx-auto grid h-12 max-w-64 grid-cols-3 rounded-2xl bg-card p-1">
        {TEMPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            aria-pressed={tempo === t}
            className={`rounded-xl text-sm font-bold ${tempo === t ? "bg-primary text-white" : "text-ink-muted"}`}
          >
            {t} dtk
          </button>
        ))}
      </div>
    </div>
  );
}
