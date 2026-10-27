"use client";

import { useEffect } from "react";

// Jaga layar tetap menyala selama sesi latihan.
// iOS 16.4+ dan Android Chrome mendukung; dibungkus try/catch karena bisa ditolak.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Ditolak browser/user — abaikan.
      }
    };
    const onVisible = () => {
      if (!document.hidden) void request();
    };
    void request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}
