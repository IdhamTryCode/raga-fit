import { describe, expect, it } from "vitest";
import { formatWeight, parseCount, parseWeight, stepWeight } from "@/lib/weight";

describe("stepWeight", () => {
  it("naik per 1 kg dari nol: 0 → 1 → 2 → 3", () => {
    let w = 0;
    const seen: number[] = [];
    for (let i = 0; i < 3; i++) seen.push((w = stepWeight(w, 1)));
    expect(seen).toEqual([1, 2, 3]);
  });

  it("tidak pernah di bawah nol", () => {
    expect(stepWeight(0, -1)).toBe(0);
    expect(stepWeight(0.5, -1)).toBe(0);
  });

  it("nilai pecahan dibulatkan searah tombol", () => {
    expect(stepWeight(12.5, 1)).toBe(13);
    expect(stepWeight(12.5, -1)).toBe(12);
  });

  it("langkah 2,5 dan 5 kg", () => {
    expect(stepWeight(0, 1, 2.5)).toBe(2.5);
    expect(stepWeight(2.5, 1, 2.5)).toBe(5);
    expect(stepWeight(7.5, 1, 2.5)).toBe(10);
    expect(stepWeight(12, 1, 5)).toBe(15);
    expect(stepWeight(12, -1, 5)).toBe(10);
  });
});

describe("parse & format", () => {
  it("menerima koma maupun titik", () => {
    expect(parseWeight("12,5")).toBe(12.5);
    expect(parseWeight(" 40 ")).toBe(40);
    expect(parseWeight("1,25")).toBe(1.3);
    expect(parseWeight("abc")).toBeNull();
    expect(parseWeight("-3")).toBeNull();
    expect(parseWeight("9999")).toBe(500);
  });

  it("repetisi bulat", () => {
    expect(parseCount("12")).toBe(12);
    expect(parseCount("12.6")).toBe(13);
    expect(parseCount("x")).toBeNull();
  });

  it("format Indonesia", () => {
    expect(formatWeight(12.5)).toBe("12,5");
    expect(formatWeight(40)).toBe("40");
  });
});
