"use client";

import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";

// Stepper besar: [-] angka [+]. Ketuk angka untuk mengetik langsung
// (keyboard angka), jadi tidak perlu tap 40 kali untuk 40 kg.
export default function NumberStepper({
  label,
  value,
  display,
  sub,
  onStep,
  onCommit,
  parse,
  decimal = false,
  disabled = false,
}: {
  label: string;
  value: number;
  display: string;
  sub?: string;
  onStep: (direction: 1 | -1) => void;
  onCommit: (value: number) => void;
  parse: (input: string) => number | null;
  decimal?: boolean;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (disabled) return;
    setDraft(value === 0 ? "" : display);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function commit() {
    const n = parse(draft === "" ? "0" : draft);
    if (n !== null) onCommit(n);
    setEditing(false);
  }

  const btn =
    "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-interactive text-white transition active:scale-95 active:bg-line disabled:opacity-40";

  return (
    <div className="rounded-2xl bg-surface/70 p-3">
      <p className="mb-2 text-xs font-bold tracking-wider text-ink-secondary">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onStep(-1)} disabled={disabled} aria-label={`Kurangi ${label}`}>
          <Minus className="size-6" strokeWidth={2.5} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ""))}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              inputMode={decimal ? "decimal" : "numeric"}
              enterKeyHint="done"
              aria-label={label}
              className="h-12 w-full rounded-xl border-[1.5px] border-primary bg-card text-center text-[28px] font-extrabold tabular outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={startEdit}
              disabled={disabled}
              aria-label={`${label}: ${display}. Ketuk untuk mengetik`}
              className="h-12 w-full rounded-xl text-[32px] font-extrabold leading-none tabular tracking-tight underline decoration-line decoration-dotted underline-offset-[6px] disabled:no-underline"
            >
              {display}
            </button>
          )}
          {sub && <p className="mt-1 truncate text-xs text-ink-muted">{sub}</p>}
        </div>

        <button type="button" className={btn} onClick={() => onStep(1)} disabled={disabled} aria-label={`Tambah ${label}`}>
          <Plus className="size-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
