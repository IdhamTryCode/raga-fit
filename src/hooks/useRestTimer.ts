"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playTimerFinishBeep } from "@/lib/audio";

// Sumber kebenaran adalah endTime (timestamp). Interval hanya memperbarui
// tampilan sehingga tetap akurat setelah app dipindah ke background.
export function useRestTimer() {
  const [remaining, setRemaining] = useState(0);
  const endRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const tick = useCallback(() => {
    if (endRef.current == null) return;
    const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left === 0 && !firedRef.current) {
      firedRef.current = true;
      endRef.current = null;
      playTimerFinishBeep();
    }
  }, []);

  useEffect(() => {
    const id = setInterval(tick, 250);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tick]);

  const start = useCallback((seconds: number) => {
    endRef.current = Date.now() + seconds * 1000;
    firedRef.current = false;
    setRemaining(seconds);
  }, []);

  const add = useCallback(
    (s: number) => {
      if (endRef.current) endRef.current += s * 1000;
      tick();
    },
    [tick],
  );

  const stop = useCallback(() => {
    endRef.current = null;
    setRemaining(0);
  }, []);

  return { remaining, start, add, stop, running: remaining > 0 };
}
