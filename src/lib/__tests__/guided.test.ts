import { describe, expect, it } from "vitest";
import { firstPending, fmtClock, nextPending, readyCount, restRemaining, workCount, workDone } from "@/lib/guided";

describe("hitungan kerja", () => {
  it("tempo 3 dtk: rep ke-1 terhitung di detik 3", () => {
    expect(workCount(0, 3000, 12)).toBe(0);
    expect(workCount(2999, 3000, 12)).toBe(0);
    expect(workCount(3000, 3000, 12)).toBe(1);
    expect(workCount(36000, 3000, 12)).toBe(12);
    expect(workCount(99000, 3000, 12)).toBe(12); // tidak lewat target
  });

  it("set selesai sedikit setelah hitungan terakhir", () => {
    expect(workDone(36000, 3000, 12)).toBe(false);
    expect(workDone(36600, 3000, 12)).toBe(true);
  });

  it("durasi: 1 hitungan per detik", () => {
    expect(workCount(45000, 1000, 45)).toBe(45);
  });
});

describe("istirahat & siap", () => {
  it("hitung mundur istirahat", () => {
    expect(restRemaining(0, 60)).toBe(60);
    expect(restRemaining(500, 60)).toBe(60);
    expect(restRemaining(55000, 60)).toBe(5);
    expect(restRemaining(60000, 60)).toBe(0);
  });

  it("siap 3-2-1", () => {
    expect(readyCount(0)).toBe(3);
    expect(readyCount(1000)).toBe(2);
    expect(readyCount(2500)).toBe(1);
    expect(readyCount(3000)).toBe(0);
  });

  it("format jam", () => {
    expect(fmtClock(75)).toBe("01:15");
  });
});

describe("urutan set", () => {
  const done = [
    [true, false, false],
    [false, false],
    [true, true],
    [false],
  ];

  it("lanjut set berikutnya di gerakan yang sama", () => {
    expect(nextPending(done, { ex: 0, set: 1 })).toEqual({ ex: 0, set: 2 });
  });

  it("pindah gerakan, melewati gerakan yang sudah selesai", () => {
    expect(nextPending(done, { ex: 1, set: 1 })).toEqual({ ex: 3, set: 0 });
  });

  it("null di akhir", () => {
    expect(nextPending(done, { ex: 3, set: 0 })).toBeNull();
  });

  it("posisi awal melewati set yang sudah selesai", () => {
    expect(firstPending(done, 0)).toEqual({ ex: 0, set: 1 });
    expect(firstPending(done, 2)).toEqual({ ex: 3, set: 0 });
  });
});
