// Semua tanggal berformat YYYY-MM-DD dan dihitung di zona waktu USER
// (disimpan di profiles.timezone), bukan zona waktu server. Server Vercel
// berjalan di UTC, jadi tanpa ini "hari ini" salah antara 00.00–07.00 WIB.
// Hari: 1 = Senin ... 7 = Minggu.

export const DEFAULT_TZ = "Asia/Jakarta";

export const DAY_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

/** Tanggal lokal (YYYY-MM-DD) dari sebuah instant di zona waktu tertentu. */
export function todayLocal(d: Date = new Date(), timeZone: string = DEFAULT_TZ): string {
  // en-CA menghasilkan format YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTz(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 1 = Senin ... 7 = Minggu, untuk tanggal YYYY-MM-DD. */
export function dayOfWeek(iso: string): number {
  const js = parseIso(iso).getUTCDay(); // 0 = Minggu
  return js === 0 ? 7 : js;
}

/** Geser tanggal YYYY-MM-DD sebanyak n hari. */
export function addDays(iso: string, n: number): string {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Tujuh tanggal Senin–Minggu dari minggu yang memuat `iso`. */
export function weekDates(iso: string): string[] {
  const monday = addDays(iso, -(dayOfWeek(iso) - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parseIso(iso));
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parseIso(iso));
}

/** Durasi dalam detik → "48 mnt" / "1 j 5 mnt" / "40 dtk". */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 60) return `${s} dtk`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} mnt`;
  return `${Math.floor(m / 60)} j ${m % 60} mnt`;
}

export function safeTz(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
