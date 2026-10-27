"use client";

import { useEffect, useRef, useState } from "react";
import { imageUrl } from "@/data/exercises";

// Dua gambar bertumpuk dengan flip CSS murni — tanpa re-render React tiap frame.
// Animasi berhenti bila kartu tidak terlihat (data-paused) dan saat user
// memilih prefers-reduced-motion (diatur lewat CSS global).
export default function ExerciseAnimator({
  exerciseId,
  name,
  className = "",
}: {
  exerciseId: string;
  name: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`animator relative ${className}`}
      data-paused={!visible}
      role="img"
      aria-label={`Demonstrasi ${name}`}
    >
      <img
        src={imageUrl(exerciseId, 0)}
        alt=""
        className="frame frame-a"
        onError={(e) => e.currentTarget.classList.add("hidden")}
      />
      <img
        src={imageUrl(exerciseId, 1)}
        alt=""
        className="frame frame-b"
        onError={(e) => e.currentTarget.classList.add("hidden")}
      />
    </div>
  );
}
