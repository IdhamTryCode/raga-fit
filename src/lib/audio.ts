"use client";

// AudioContext dibuat/di-resume di dalam handler tap pertama (syarat iOS Safari).
// iOS juga bisa menaruh context ke state suspended/interrupted saat app
// dipindah ke background, maka di-resume lagi saat kembali visible.

let ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function unlockAudio(): void {
  const audio = getAudioContext();
  if (audio && audio.state === "suspended") void audio.resume();
}

export function playTimerFinishBeep(): void {
  const audio = getAudioContext();
  if (!audio) return;
  try {
    if (audio.state === "suspended") void audio.resume();
    const tone = (start: number, freq: number) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audio.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + start + 0.18);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + start);
      osc.stop(audio.currentTime + start + 0.2);
    };
    tone(0, 880);
    tone(0.22, 1108);
  } catch {
    // Audio tidak krusial — gagal diabaikan.
  }
  navigator.vibrate?.([200, 100, 200]);
}

// iOS: context bisa suspended saat kembali ke tab.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && ctx && ctx.state === "suspended") void ctx.resume();
  });
}
