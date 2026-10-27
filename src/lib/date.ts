// Tanggal selalu pakai waktu lokal perangkat dalam format YYYY-MM-DD.
// Date.getDay(): 0 = Minggu; skema DB memakai Senin = 1 ... Minggu = 7.

export function todayLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 1 = Senin ... 7 = Minggu */
export function toDayOfWeek(d = new Date()): number {
  const js = d.getDay(); // 0 = Minggu
  return js === 0 ? 7 : js;
}

export function weekRange(d = new Date()): { monday: string; sunday: string } {
  const dow = toDayOfWeek(d);
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday: todayLocal(monday), sunday: todayLocal(sunday) };
}
