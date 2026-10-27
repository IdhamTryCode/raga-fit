import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

interface DayCardProps {
  dayOfWeek: number;
  title: string;
  isRest: boolean;
  exerciseCount: number;
  done: boolean;
  missed: boolean;
  isToday: boolean;
}

export default function DayCard({
  dayOfWeek,
  title,
  isRest,
  exerciseCount,
  done,
  missed,
  isToday,
}: DayCardProps) {
  const status = isRest
    ? null
    : done
      ? { icon: <Check className="size-4" />, label: "Selesai", className: "text-success" }
      : missed
        ? { label: "Terlewat", className: "text-ink-muted" }
        : { label: "Belum", className: "text-ink-secondary" };

  return (
    <Link
      href={isRest ? "#" : `/workout/${dayOfWeek}`}
      aria-disabled={isRest}
      className={`flex items-center gap-3 rounded-card border px-4 py-4 ${
        isToday
          ? "border-primary bg-card shadow-[0px_4px_20px_rgba(255,90,44,0.15)]"
          : "border-line bg-card"
      } ${isRest ? "opacity-50" : ""}`}
    >
      <span
        className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-card text-xs font-bold ${
          isToday ? "bg-primary text-white" : "bg-interactive text-ink-secondary"
        }`}
      >
        {DAY_LABELS[dayOfWeek - 1]}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-white">{title}</p>
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          {isRest ? "Recovery" : `${exerciseCount} gerakan`}
          {status && (
            <span className={`inline-flex items-center gap-1 font-semibold ${status.className}`}>
              {status.icon}
              {status.label}
            </span>
          )}
        </p>
      </div>

      {isToday && (
        <span className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-white">
          Mulai Latihan
        </span>
      )}
      {!isToday && !isRest && <ArrowRight className="size-4 shrink-0 text-ink-muted" />}
    </Link>
  );
}
