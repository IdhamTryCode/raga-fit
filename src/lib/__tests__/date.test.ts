import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, formatDuration, todayLocal, weekDates } from "@/lib/date";

describe("todayLocal", () => {
  it("memakai zona waktu user, bukan zona server", () => {
    // 31 Des 2025 20:00 UTC = 1 Jan 2026 03:00 WIB
    const instant = new Date(Date.UTC(2025, 11, 31, 20, 0));
    expect(todayLocal(instant, "Asia/Jakarta")).toBe("2026-01-01");
    expect(todayLocal(instant, "UTC")).toBe("2025-12-31");
  });

  it("zona waktu tidak valid jatuh ke Asia/Jakarta", () => {
    const instant = new Date(Date.UTC(2025, 11, 31, 20, 0));
    expect(todayLocal(instant, "Bukan/Zona")).toBe("2026-01-01");
  });
});

describe("dayOfWeek", () => {
  it("Senin = 1, Kamis = 4, Minggu = 7", () => {
    expect(dayOfWeek("2026-01-05")).toBe(1);
    expect(dayOfWeek("2026-01-01")).toBe(4);
    expect(dayOfWeek("2026-01-04")).toBe(7);
  });
});

describe("addDays & weekDates", () => {
  it("melewati pergantian bulan dan tahun", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("minggu Senin–Minggu, termasuk saat hari ini Minggu", () => {
    expect(weekDates("2026-01-04")).toEqual([
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
    expect(weekDates("2026-01-05")[0]).toBe("2026-01-05");
  });
});

describe("formatDuration", () => {
  it("detik, menit, jam", () => {
    expect(formatDuration(40)).toBe("40 dtk");
    expect(formatDuration(48 * 60)).toBe("48 mnt");
    expect(formatDuration(65 * 60)).toBe("1 j 5 mnt");
  });
});
