// Logika murni mode timer berpemandu (tanpa React), supaya mudah diuji.
//
// Alur: siap (3-2-1) → kerja (hitung rep) → istirahat (hitung mundur) → kerja → … → selesai.
// Repetisi dihitung satu per `tempoMs` (bawaan 3 dtk/rep, aman untuk pemula);
// gerakan durasi dihitung per detik.

export interface Pos {
  ex: number; // indeks gerakan
  set: number; // indeks set (0-based)
}

export const READY_MS = 3000;
export const TEMPOS = [2, 3, 4] as const; // detik per rep
export const DEFAULT_TEMPO = 3;
/** Jeda kecil setelah hitungan terakhir sebelum pindah ke istirahat. */
export const WORK_TAIL_MS = 600;

/** Jumlah hitungan yang sudah selesai (0 … target). */
export function workCount(elapsedMs: number, tempoMs: number, target: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.min(target, Math.floor(elapsedMs / tempoMs));
}

export function workDone(elapsedMs: number, tempoMs: number, target: number): boolean {
  return elapsedMs >= target * tempoMs + WORK_TAIL_MS;
}

/** Sisa detik istirahat, dibulatkan ke atas supaya tampilan 00:00 = benar-benar habis. */
export function restRemaining(elapsedMs: number, totalSec: number): number {
  return Math.max(0, Math.ceil(totalSec - elapsedMs / 1000));
}

/** Angka hitung mundur siap: 3, 2, 1, lalu 0 = mulai. */
export function readyCount(elapsedMs: number): number {
  return Math.max(0, Math.ceil((READY_MS - elapsedMs) / 1000));
}

/**
 * Set berikutnya yang belum selesai, mulai setelah `from`:
 * sisa set gerakan yang sama dulu, lalu gerakan-gerakan berikutnya.
 * `done[ex][set]` = sudah selesai.
 */
export function nextPending(done: boolean[][], from: Pos): Pos | null {
  for (let s = from.set + 1; s < (done[from.ex]?.length ?? 0); s++) {
    if (!done[from.ex][s]) return { ex: from.ex, set: s };
  }
  for (let e = from.ex + 1; e < done.length; e++) {
    const s = done[e].findIndex((d) => !d);
    if (s !== -1) return { ex: e, set: s };
  }
  return null;
}

/** Posisi awal: set pertama yang belum selesai di gerakan `ex`, atau sesudahnya. */
export function firstPending(done: boolean[][], ex: number): Pos | null {
  const s = done[ex]?.findIndex((d) => !d) ?? -1;
  if (s !== -1) return { ex, set: s };
  return nextPending(done, { ex, set: (done[ex]?.length ?? 0) - 1 });
}

export function fmtClock(sec: number): string {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}
