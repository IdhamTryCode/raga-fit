import { describe, expect, it } from "vitest";
import { getExercise } from "@/data/exercises";
import { generateProgram, nextPosition, rotationSize } from "@/lib/program";

const FOCUSES = ["glutes_lower", "back_chest"] as const;
const LOCATIONS = ["home", "gym", "both"] as const;
const DAYS = [2, 3, 4, 5, 6];

describe("generateProgram", () => {
  for (const focus of FOCUSES) {
    for (const location of LOCATIONS) {
      for (const days of DAYS) {
        it(`${focus} / ${location} / ${days} hari`, () => {
          const a = generateProgram(location, focus, days);
          expect(generateProgram(location, focus, days)).toEqual(a); // deterministik
          expect(a).toHaveLength(rotationSize(days));
          a.forEach((w, i) => {
            expect(w.position).toBe(i + 1);
            expect(w.exercise_ids).toHaveLength(6);
            expect(new Set(w.exercise_ids).size).toBe(6); // tanpa duplikat
            for (const id of w.exercise_ids) {
              const ex = getExercise(id);
              expect(ex?.autoPick).toBe(true);
              if (location === "home") expect(ex?.location).not.toBe("gym");
            }
          });
        });
      }
    }
  }

  it("mode gym dan rumah menghasilkan program berbeda", () => {
    const gym = generateProgram("gym", "back_chest", 4).flatMap((w) => w.exercise_ids);
    const both = generateProgram("both", "back_chest", 4).flatMap((w) => w.exercise_ids);
    const home = generateProgram("home", "back_chest", 4).flatMap((w) => w.exercise_ids);
    expect(gym).not.toEqual(home);
    expect(both).not.toEqual(home);
  });

  it("gerakan bervariasi antar latihan dengan otot yang sama", () => {
    const program = generateProgram("home", "glutes_lower", 5);
    const [a, , c] = program; // keduanya punya banyak glutes
    const overlap = a.exercise_ids.filter((id) => c.exercise_ids.includes(id));
    expect(overlap.length).toBeLessThan(c.exercise_ids.length);
  });
});

describe("nextPosition", () => {
  it("mulai dari 1 lalu berputar", () => {
    expect(nextPosition(null, 3)).toBe(1);
    expect(nextPosition(1, 3)).toBe(2);
    expect(nextPosition(3, 3)).toBe(1);
  });
});
