// Primitif tombol & input sesuai design system "Raga" (DESIGN.md).

import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-14 w-full rounded-card bg-primary text-base font-bold text-white transition active:scale-[0.98] active:brightness-95 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`h-14 w-full rounded-card border border-line bg-card text-base font-semibold text-ink-secondary transition hover:border-ink-muted hover:text-white active:scale-[0.98] ${className}`}
      {...props}
    />
  );
}

export function TextField({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-12 w-full rounded-card border border-line bg-card px-4 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink-muted focus:outline-none ${className}`}
      {...props}
    />
  );
}
