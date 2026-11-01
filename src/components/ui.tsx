"use client";

// Primitif UI sesuai design system "Raga" (stitch_raga_workout_tracker_ui/raga/DESIGN.md).

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

export function PrimaryButton({
  className = "",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-white shadow-[0_8px_24px_rgba(255,90,44,0.25)] transition active:scale-[0.98] active:brightness-95 disabled:opacity-50 disabled:shadow-none ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-5 animate-spin" />}
      {children}
    </button>
  );
}

export function SecondaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card text-base font-semibold text-ink-secondary transition hover:border-ink-muted hover:text-white active:scale-[0.98] disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}

export function Field({ label, error, hint, trailing, className = "", id, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-white">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error || hint ? msgId : undefined}
          className={`h-14 w-full rounded-2xl border bg-card px-4 text-base text-ink outline-none transition placeholder:text-ink-muted focus:border-primary ${
            trailing ? "pr-14" : ""
          } ${error ? "border-error" : "border-line"}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {(error || hint) && (
        <p id={msgId} className={`mt-1.5 text-[13px] ${error ? "text-error" : "text-ink-muted"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function PasswordField(props: Omit<FieldProps, "type" | "trailing">) {
  const [show, setShow] = useState(false);
  return (
    <Field
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          className="flex size-12 items-center justify-center rounded-xl text-ink-muted transition hover:text-white"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    />
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "info"; children: ReactNode }) {
  return (
    <p
      role="alert"
      className={`rounded-2xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-error/40 bg-error/10 text-[#ffb3a1]"
          : "border-success/40 bg-success/10 text-success"
      }`}
    >
      {children}
    </p>
  );
}

/** Logo aplikasi: kotak gelap dengan garis denyut oranye (sesuai referensi). */
export function Logo({ className = "size-16" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-2xl border border-line bg-card ${className}`}>
      <svg viewBox="0 0 24 24" className="size-1/2" fill="none" stroke="#ff5a2c" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 13h3l2.5-6 4 11 2.5-7 1.5 2H21" />
      </svg>
    </div>
  );
}
