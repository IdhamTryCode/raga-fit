// Program latihan = rotasi Latihan A, B, C, ... yang TIDAK terikat hari.
// Hari pilihan user hanya rencana; latihan berikutnya selalu bisa dimulai kapan saja.
// Deterministik: input sama → hasil sama (tanpa random).

import { EXERCISES, type Exercise, type LocationMode, type MuscleGroup } from "@/data/exercises";

export type FocusMuscle = "glutes_lower" | "back_chest";

interface Blueprint {
  title: string;
  groups: [MuscleGroup, number][];
}

const GLUTES_LOWER: Blueprint[] = [
  { title: "Fokus Bokong & Paha Belakang", groups: [["glutes_hamstrings", 4], ["quads_calves", 1], ["core", 1]] },
  { title: "Upper Body: Punggung & Dada", groups: [["back", 2], ["chest", 2], ["shoulders", 1], ["arms", 1]] },
  { title: "Bokong, Paha Depan & Perut", groups: [["glutes_hamstrings", 2], ["quads_calves", 3], ["core", 1]] },
  { title: "Bokong & Upper Ringan", groups: [["glutes_hamstrings", 3], ["back", 1], ["shoulders", 1], ["core", 1]] },
  { title: "Full Body & Core", groups: [["glutes_hamstrings", 2], ["quads_calves", 1], ["back", 1], ["core", 2]] },
];

const BACK_CHEST: Blueprint[] = [
  { title: "Fokus Punggung & Postur", groups: [["back", 3], ["shoulders", 2], ["arms", 1]] },
  { title: "Kaki, Bokong & Perut", groups: [["glutes_hamstrings", 2], ["quads_calves", 2], ["core", 2]] },
  { title: "Dada, Punggung & Lengan", groups: [["chest", 3], ["back", 2], ["arms", 1]] },
  { title: "Upper Body & Core", groups: [["back", 2], ["chest", 2], ["shoulders", 1], ["core", 1]] },
  { title: "Lower Body & Core", groups: [["glutes_hamstrings", 3], ["quads_calves", 2], ["core", 1]] },
];

const TEMPLATES: Record<FocusMuscle, Blueprint[]> = {
  glutes_lower: GLUTES_LOWER,
  back_chest: BACK_CHEST,
};

/** Usulan hari bawaan untuk tiap frekuensi (user boleh mengubahnya). */
export const DEFAULT_DAYS: Record<number, number[]> = {
  2: [2, 5],
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
};

export const LETTERS = ["A", "B", "C", "D", "E"] as const;

/** Jumlah latihan dalam rotasi: 3–5 sesuai frekuensi. */
export function rotationSize(daysPerWeek: number): number {
  return Math.min(5, Math.max(3, daysPerWeek));
}

export interface ProgramWorkout {
  position: number; // 1-based
  title: string;
  exercise_ids: string[];
}

export function generateProgram(
  locationMode: LocationMode,
  focus: FocusMuscle,
  daysPerWeek: number,
): ProgramWorkout[] {
  const blueprints = TEMPLATES[focus] ?? GLUTES_LOWER;
  const size = rotationSize(daysPerWeek);

  const pool = EXERCISES.filter(
    (e) => e.autoPick && !(locationMode === "home" && e.location === "gym"),
  );
  const order = new Map(pool.map((e, i) => [e.id, i]));
  const timesUsed = new Map<string, number>();

  return Array.from({ length: size }, (_, w): ProgramWorkout => {
    const bp = blueprints[w % blueprints.length];
    const used = new Set<string>();
    const ids: string[] = [];

    for (const [group, count] of bp.groups) {
      const picks = pool
        .filter((e) => e.muscleGroup === group && !used.has(e.id))
        .sort(
          (a, b) =>
            // 1) gerakan yang belum sering dipakai di program ini → variasi antar latihan
            (timesUsed.get(a.id) ?? 0) - (timesUsed.get(b.id) ?? 0) ||
            // 2) preferensi lokasi
            locationRank(a, locationMode, w) - locationRank(b, locationMode, w) ||
            // 3) urutan katalog
            order.get(a.id)! - order.get(b.id)!,
        )
        .slice(0, count);

      for (const e of picks) {
        used.add(e.id);
        ids.push(e.id);
        timesUsed.set(e.id, (timesUsed.get(e.id) ?? 0) + 1);
      }
    }

    return { position: w + 1, title: bp.title, exercise_ids: ids };
  });
}

// gym: utamakan alat gym. both: selang-seling, latihan genap → gym, ganjil → rumah.
function locationRank(e: Exercise, mode: LocationMode, workoutIdx: number): number {
  if (mode === "gym") return e.location === "gym" ? 0 : 1;
  if (mode === "both") {
    const preferGym = workoutIdx % 2 === 0;
    if (e.location === "both") return 0;
    return (e.location === "gym") === preferGym ? 0 : 1;
  }
  return 0;
}

/** Posisi latihan berikutnya setelah latihan terakhir yang diselesaikan. */
export function nextPosition(lastFinishedPosition: number | null, total: number): number {
  if (!lastFinishedPosition || total <= 0) return 1;
  return (lastFinishedPosition % total) + 1;
}

/** Perkiraan durasi (menit) & total set dari daftar gerakan. ~40 dtk kerja per set + istirahat. */
export function workoutStats(exerciseIds: string[]): { exercises: number; sets: number; minutes: number } {
  let sets = 0;
  let seconds = 0;
  for (const id of exerciseIds) {
    const ex = EXERCISES.find((e) => e.id === id);
    if (!ex) continue;
    sets += ex.sets;
    seconds += ex.sets * (40 + ex.restSeconds);
  }
  return { exercises: exerciseIds.length, sets, minutes: Math.max(5, Math.round(seconds / 300) * 5) };
}

export function workoutLabel(position: number): string {
  return `Latihan ${LETTERS[position - 1] ?? position}`;
}
