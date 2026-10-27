import { describe, expect, it } from "vitest";
import { todayLocal, toDayOfWeek, weekRange } from "@/lib/date";

// Kamis 1 Januari 2026
const JAN1_2026 = new Date(2026, 0, 1);
// Minggu 4 Jan 2026
const JAN4_2026 = new Date(2026, 0, 4);
// Akhir bulan: Sabtu 31 Jan 2026
const JAN31_2026 = new Date(2026, 0, 31);
// Pergantian tahun: Rabu 31 Des 2025
const DEC31_2025 = new Date(2025, 11, 31);
// Senin 5 Mei 2025 — awal minggu memotong bulan sebelumnya
const MAY5_2026 = new Date(2026, 4, 4); // Senin 4 Mei 2026

describe("todayLocal", () => {
  it("memformat dengan pad dua digit", () => {
    expect(todayLocal(JAN1_2026)).toBe("2026-01-01");
    expect(todayLocal(DEC31_2025)).toBe("2025-12-31");
  });
});

describe("toDayOfWeek", () => {
  it("Senin = 1", () => {
    expect(toDayOfWeek(new Date(2026, 0, 5))).toBe(1);
  });
  it("Minggu = 7", () => {
    expect(toDayOfWeek(JAN4_2026)).toBe(7);
  });
  it("Kamis = 4", () => {
    expect(toDayOfWeek(JAN1_2026)).toBe(4);
  });
});

describe("weekRange", () => {
  it("minggu penuh dari hari Kamis", () => {
    const { monday, sunday } = weekRange(JAN1_2026);
    expect(monday).toBe("2025-12-29");
    expect(sunday).toBe("2026-01-04");
  });
  it("minggu dari hari Minggu tetap minggu yang sama", () => {
    const { monday, sunday } = weekRange(JAN4_2026);
    expect(monday).toBe("2025-12-29");
    expect(sunday).toBe("2026-01-04");
  });
  it("awal minggu yang memotong bulan", () => {
    const { monday } = weekRange(MAY5_2026);
    expect(monday).toBe("2026-05-04");
  });
  it("pergantian tahun", () => {
    const { monday } = weekRange(DEC31_2025);
    expect(monday).toBe("2025-12-29");
  });
  it("akhir bulan", () => {
    const { monday, sunday } = weekRange(JAN31_2026);
    expect(monday).toBe("2026-01-26");
    expect(sunday).toBe("2026-02-01");
  });
});
