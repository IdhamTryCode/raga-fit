"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Antrean simpan set: UI berubah seketika, penyimpanan berjalan di belakang.
// Operasi dengan key sama (exercise:set) digabung — yang terakhir menang.
// Antrean disalin ke localStorage supaya selamat saat tab ditutup/refresh,
// dan dicoba ulang otomatis saat koneksi kembali.

export type SyncOp =
  | { kind: "upsert"; exerciseId: string; setNumber: number; weight: number; reps: number }
  | { kind: "delete"; exerciseId: string; setNumber: number };

export type SyncStatus = "idle" | "saving" | "offline";

const keyOf = (op: SyncOp) => `${op.exerciseId}:${op.setNumber}`;
const RETRY_MS = 4000;

export function useSyncQueue(sessionId: string, userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const storageKey = `raga:queue:${sessionId}`;
  const queue = useRef<SyncOp[]>([]);
  const running = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(0);
  const [status, setStatus] = useState<SyncStatus>("idle");

  const persist = useCallback(() => {
    setPending(queue.current.length);
    try {
      if (queue.current.length) localStorage.setItem(storageKey, JSON.stringify(queue.current));
      else localStorage.removeItem(storageKey);
    } catch {
      // storage penuh/diblokir — antrean tetap jalan di memori
    }
  }, [storageKey]);

  const send = useCallback(
    async (op: SyncOp) => {
      if (op.kind === "upsert") {
        return supabase.from("workout_logs").upsert(
          {
            user_id: userId,
            session_id: sessionId,
            exercise_id: op.exerciseId,
            set_number: op.setNumber,
            weight_kg: op.weight,
            reps_or_seconds: op.reps,
          },
          { onConflict: "session_id,exercise_id,set_number" },
        );
      }
      return supabase
        .from("workout_logs")
        .delete()
        .eq("session_id", sessionId)
        .eq("exercise_id", op.exerciseId)
        .eq("set_number", op.setNumber);
    },
    [supabase, sessionId, userId],
  );

  // Retry memanggil versi flush terbaru lewat ref (bukan lewat closure dirinya sendiri).
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const scheduleRetry = useCallback(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => void flushRef.current(), RETRY_MS);
  }, []);

  const flush = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    if (retryTimer.current) clearTimeout(retryTimer.current);

    while (queue.current.length) {
      setStatus("saving");
      const op = queue.current[0];
      let ok = false;
      try {
        const { error } = await send(op);
        ok = !error;
      } catch {
        ok = false;
      }
      if (!ok) {
        setStatus("offline");
        running.current = false;
        scheduleRetry();
        return;
      }
      // Hapus hanya bila op belum digantikan versi yang lebih baru.
      if (queue.current[0] === op) queue.current.shift();
      persist();
    }

    setStatus("idle");
    running.current = false;
  }, [send, persist, scheduleRetry]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const enqueue = useCallback(
    (op: SyncOp) => {
      const k = keyOf(op);
      const idx = queue.current.findIndex((o, i) => i > 0 && keyOf(o) === k);
      // Indeks 0 mungkin sedang dikirim — jangan diganti, tambahkan saja di belakang.
      if (idx > 0) queue.current[idx] = op;
      else queue.current.push(op);
      persist();
      void flush();
    },
    [persist, flush],
  );

  // Pulihkan antrean dari sesi sebelumnya (tab ditutup sebelum sempat tersimpan).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        queue.current = JSON.parse(raw) as SyncOp[];
        persist();
        void flush();
      }
    } catch {
      // abaikan data rusak
    }
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [storageKey, persist, flush]);

  /** Tunggu antrean kosong (maks `timeoutMs`). true = semua tersimpan. */
  const drain = useCallback(
    async (timeoutMs = 8000) => {
      const end = Date.now() + timeoutMs;
      while (queue.current.length && Date.now() < end) {
        await flush();
        if (queue.current.length) await new Promise((r) => setTimeout(r, 500));
      }
      return queue.current.length === 0;
    },
    [flush],
  );

  return { enqueue, drain, pending, status };
}
