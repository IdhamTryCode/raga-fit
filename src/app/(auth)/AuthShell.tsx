import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

export default function AuthShell({ mode, children }: { mode: "masuk" | "daftar"; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(48px+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-5 text-[28px] font-extrabold tracking-tight">Raga</h1>
          <p className="mt-1 text-sm text-ink-secondary">Catat latihanmu, lihat progresmu.</p>
        </div>

        <nav className="mb-7 grid h-14 grid-cols-2 rounded-2xl bg-card p-1.5" aria-label="Pilih Masuk atau Daftar">
          {(
            [
              ["masuk", "Masuk", "/login"],
              ["daftar", "Daftar", "/daftar"],
            ] as const
          ).map(([key, label, href]) => (
            <Link
              key={key}
              href={href}
              replace
              aria-current={mode === key ? "page" : undefined}
              className={`flex items-center justify-center rounded-xl text-sm font-bold transition ${
                mode === key ? "bg-primary text-white" : "text-ink-muted hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </main>
  );
}
