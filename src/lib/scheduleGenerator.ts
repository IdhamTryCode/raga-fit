// Generator jadwal otomatis — Masterplan MVP Lite bagian 8.
// Deterministik: hasil identik untuk input yang sama (tanpa random).

import { EXERCISES, type LocationMode, type MuscleGroup } from "@/data/exercises";

interface DayBlueprint {
  title: string;
  groups: [MuscleGroup, number][];
}

const GLUTES_LOWER: DayBlueprint[] = [
  { title: "Fokus Bokong & Paha Belakang", groups: [["glutes_hamstrings", 4], ["quads_calves", 1], ["core", 1]] },
  { title: "Upper Body: Punggung & Dada", groups: [["back", 2], ["chest", 2], ["shoulders", 1], ["arms", 1]] },
  { title: "Bokong, Paha Depan & Perut", groups: [["glutes_hamstrings", 2], ["quads_calves", 3], ["core", 1]] },
  { title: "Bokong & Upper Ringan", groups: [["glutes_hamstrings", 3], ["back", 1], ["shoulders", 1], ["core", 1]] },
  { title: "Full Body & Core", groups: [["glutes_hamstrings", 2], ["quads_calves", 1], ["back", 1], ["core", 2]] },
];

const BACK_CHEST: DayBlueprint[] = [
  { title: "Fokus Punggung & Postur", groups: [["back", 3], ["shoulders", 2], ["arms", 1]] },
  { title: "Kaki, Bokong & Perut", groups: [["glutes_hamstrings", 2], ["quads_calves", 2], ["core", 2]] },
  { title: "Dada, Punggung & Lengan", groups: [["chest", 3], ["back", 2], ["arms", 1]] },
  { title: "Upper Body & Core", groups: [["back", 2], ["chest", 2], ["shoulders", 1], ["core", 1]] },
  { title: "Lower Body & Core", groups: [["glutes_hamstrings", 3], ["quads_calves", 2], ["core", 1]] },
];

const FOCUS_TEMPLATES = {
  glutes_lower: GLUTES_LOWER,
  back_chest: BACK_CHEST,
} as const;

export type FocusMuscle = keyof typeof FOCUS_TEMPLATES;

const ACTIVE_DAYS: Record<number, number[]> = {
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
};

export interface ScheduleRow {
  user_id: string;
  day_of_week: number;
  day_title: string;
  is_rest_day: boolean;
  exercise_ids: string[];
}

const REST_TITLE = "Istirahat & Pemulihan";

// Gerakan khusus gym didahulukan hanya pada mode 'gym'.
const rank = (loc: LocationMode, mode: LocationMode) => (mode === "gym" && loc === "gym" ? 0 : 1);

export function generateWeeklySchedule(
  userId: string,
  locationMode: LocationMode,
  focusMuscle: string,
  daysPerWeek: number,
): ScheduleRow[] {
  const templates = FOCUS_TEMPLATES[focusMuscle === "back_chest" ? "back_chest" : "glutes_lower"];
  const activeDays = ACTIVE_DAYS[daysPerWeek] ?? ACTIVE_DAYS[4];

  const pool = EXERCISES.filter(
    (e) => e.autoPick && !(locationMode === "home" && e.location === "gym"),
  );

  let templateIndex = 0;
  return [1, 2, 3, 4, 5, 6, 7].map((day): ScheduleRow => {
    if (!activeDays.includes(day)) {
      return {
        user_id: userId,
        day_of_week: day,
        day_title: REST_TITLE,
        is_rest_day: true,
        exercise_ids: [],
      };
    }
    const blueprint = templates[templateIndex++ % templates.length];
    const used = new Set<string>();
    const ids: string[] = [];
    for (const [group, count] of blueprint.groups) {
      const picks = pool
        .filter((e) => e.muscleGroup === group && !used.has(e.id))
        .sort((a, b) => rank(a.location, locationMode) - rank(b.location, locationMode));
      picks.slice(0, count).forEach((e) => {
        used.add(e.id);
        ids.push(e.id);
      });
    }
    return {
      user_id: userId,
      day_of_week: day,
      day_title: blueprint.title,
      is_rest_day: false,
      exercise_ids: ids,
    };
  });
}
