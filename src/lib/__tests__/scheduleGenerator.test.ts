import { describe, expect, it } from "vitest";
import { EXERCISES, getExercise } from "@/data/exercises";
import { generateWeeklySchedule } from "@/lib/scheduleGenerator";

const FOCUSES = ["glutes_lower", "back_chest"] as const;
const LOCATIONS = ["home", "gym", "both"] as const;
const DAYS = [3, 4, 5];

const EXPECTED_DAYS: Record<number, number[]> = {
  3: [1, 3, 5],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
};

describe("generateWeeklySchedule", () => {
  for (const focus of FOCUSES) {
    for (const location of LOCATIONS) {
      for (const days of DAYS) {
        it(`konsisten: ${focus} / ${location} / ${days} hari`, () => {
          const a = generateWeeklySchedule("u1", location, focus, days);
          const b = generateWeeklySchedule("u1", location, focus, days);
          expect(a).toEqual(b);

          expect(a).toHaveLength(7);
          const restDays = a.filter((r) => r.is_rest_day);
          const workoutDays = a.filter((r) => !r.is_rest_day);
          expect(workoutDays).toHaveLength(days);
          expect(restDays).toHaveLength(7 - days);
          expect(workoutDays.map((r) => r.day_of_week).sort((x, y) => x - y)).toEqual(
            EXPECTED_DAYS[days],
          );
        });
      }
    }
  }

  it("mode home tidak pernah memakai gerakan khusus gym", () => {
    for (const focus of FOCUSES) {
      for (const days of DAYS) {
        const schedule = generateWeeklySchedule("u1", "home", focus, days);
        for (const row of schedule) {
          for (const id of row.exercise_ids) {
            expect(getExercise(id)?.location).not.toBe("gym");
            expect(getExercise(id)?.autoPick).toBe(true);
          }
        }
      }
    }
  });

  it("tidak ada gerakan autoPick false dan tidak ada duplikat per hari", () => {
    for (const focus of FOCUSES) {
      for (const location of LOCATIONS) {
        for (const days of DAYS) {
          const schedule = generateWeeklySchedule("u1", location, focus, days);
          for (const row of schedule) {
            expect(new Set(row.exercise_ids).size).toBe(row.exercise_ids.length);
            for (const id of row.exercise_ids) {
              const ex = getExercise(id);
              expect(ex).not.toBeNull();
              expect(ex?.autoPick).toBe(true);
            }
          }
        }
      }
    }
  });

  it("jumlah gerakan sesuai blueprint template", () => {
    // Slot per hari aktif: template 5 hari (3 & 5 hari memakai subset urutan)
    const slotsPerWorkoutDay = 6; // semua blueprint punya total 6 slot
    for (const focus of FOCUSES) {
      for (const location of LOCATIONS) {
        for (const days of DAYS) {
          const schedule = generateWeeklySchedule("u1", location, focus, days);
          const workoutRows = schedule.filter((r) => !r.is_rest_day);
          for (const row of workoutRows) {
            expect(row.exercise_ids).toHaveLength(slotsPerWorkoutDay);
          }
        }
      }
    }
  });

  it("hari istirahat tidak punya gerakan", () => {
    const schedule = generateWeeklySchedule("u1", "both", "glutes_lower", 3);
    for (const row of schedule) {
      if (row.is_rest_day) {
        expect(row.exercise_ids).toEqual([]);
        expect(row.day_title).toBe("Istirahat & Pemulihan");
      }
    }
  });

  it("catalog punya cukup kandidat home untuk setiap slot grup", () => {
    // guard reg Wyv: pool home autoPick per grup >= slot terbesar template
    const need = {
      glutes_hamstrings: 4,
      quads_calves: 3,
      core: 2,
      back: 3,
      chest: 3,
      shoulders: 2,
      arms: 1,
    };
    for (const [group, count] of Object.entries(need)) {
      const candidates = EXERCISES.filter(
        (e) => e.muscleGroup === group && e.autoPick && e.location !== "gym",
      );
      expect(candidates.length).toBeGreaterThanOrEqual(count);
    }
  });
});
