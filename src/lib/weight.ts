// Aturan input beban & repetisi.
// Tombol +/- selalu mendarat di kelipatan `step` (bawaan 1 kg): 0 → 1 → 2 → 3.
// Nilai pecahan (mis. 12,5 hasil ketik manual) dibulatkan ke kelipatan terdekat
// searah tombol: 12,5 + 1 → 13, 12,5 − 1 → 12.

export const MAX_WEIGHT = 500;
export const MAX_COUNT = 999;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function stepWeight(current: number, direction: 1 | -1, step = 1): number {
  const s = step > 0 ? step : 1;
  const k = current / s;
  // Toleransi floating point: 2.9999999 dianggap 3.
  const snapped = Math.abs(k - Math.round(k)) < 1e-6 ? Math.round(k) : k;
  const next = direction === 1 ? (Math.floor(snapped) + 1) * s : (Math.ceil(snapped) - 1) * s;
  return clamp(round1(next), 0, MAX_WEIGHT);
}

/** "12,5" / "12.5" / " 40 " → angka; null bila tidak valid. Maks 1 desimal (skema DB). */
export function parseWeight(input: string): number | null {
  const n = Number(input.trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return clamp(round1(n), 0, MAX_WEIGHT);
}

export function parseCount(input: string): number | null {
  const n = Number(input.trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return clamp(Math.round(n), 0, MAX_COUNT);
}

export function formatWeight(n: number): string {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
