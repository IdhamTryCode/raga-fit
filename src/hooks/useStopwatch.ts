"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playTimerFinishBeep } from "@/lib/audio";

// Hitung mundur dari targetSeconds untuk gerakan durasi.
// Berbasis timestamp sehingga tetap akurat setelah pindah aplikasi.
export function useStopwatch(targetSeconds: number) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null); // timestamp mulai
  const baseRef = useRef(0); // detik terkumpul sebelum jeda

  const read = () =>
    baseRef.current + (startRef.current ? (Date.now() - startRef.current) / 1000 : 0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const e = Math.floor(read());
      setElapsed(e);
      if (e >= targetSeconds) {
        baseRef.current = targetSeconds;
        startRef.current = null;
        setRunning(false);
        setElapsed(targetSeconds);
        playTimerFinishBeep();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, targetSeconds]);

  const start = useCallback(() => {
    startRef.current = Date.now();
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    baseRef.current = read();
    startRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    baseRef.current = 0;
    startRef.current = null;
    setRunning(false);
    setElapsed(0);
  }, []);

  return { elapsed, remaining: Math.max(0, targetSeconds - elapsed), running, start, pause, reset };
}
