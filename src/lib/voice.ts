"use client";

// Suara hitungan pakai Text-to-Speech bawaan perangkat (gratis, tanpa file audio).
// Hanya dipakai bila ada suara berbahasa Indonesia; kalau tidak ada, fallback ke beep
// supaya tidak terdengar "twelve" dengan suara Inggris.

import { playBeep, unlockAudio } from "@/lib/audio";

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

function indonesianVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const voices = s.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase().replace("_", "-") === "id-id") ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("id")) ??
    null
  );
}

export function hasIndonesianVoice(): boolean {
  return indonesianVoice() !== null;
}

/** Ucapkan teks. Mengembalikan false bila tidak ada suara Indonesia. */
export function speak(text: string, { interrupt = true }: { interrupt?: boolean } = {}): boolean {
  const s = synth();
  const voice = indonesianVoice();
  if (!s || !voice) return false;
  if (interrupt) s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 1.1;
  u.pitch = 1;
  s.speak(u);
  return true;
}

/** Ucapkan teks, atau beep bila suara tidak tersedia. */
export function cue(text: string, beepFreq = 880): void {
  if (!speak(text)) playBeep(beepFreq);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}

/** Wajib dipanggil di dalam tap (iOS hanya mengizinkan audio setelah interaksi user). */
export function primeVoice(): void {
  unlockAudio();
  const s = synth();
  if (!s) return;
  s.getVoices(); // memicu pemuatan daftar suara
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  s.speak(u);
}
