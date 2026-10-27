"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PrimaryButton, TextField } from "@/components/ui";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw toMessage(error.message);
        router.replace("/onboarding");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw toMessage(error.message);

      // Belum pernah onboarding → arahkan ke sana.
      const { data: profile } = await supabase
        .from("profiles")
        .select("program_started_on")
        .eq("id", data.user.id)
        .maybeSingle();

      router.replace(profile?.program_started_on ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-3xl font-extrabold text-white">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Raga Fit</h1>
          <p className="mt-1 text-sm text-ink-secondary">Catat latihanmu, lihat progresmu.</p>
        </div>

        {/* Toggle Masuk | Daftar */}
        <div className="mb-6 flex h-12 items-center rounded-full bg-card p-1">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === m ? "bg-primary text-white" : "text-ink-muted"
              }`}
            >
              {m === "signin" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <TextField
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative">
            <TextField
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="Password (min. 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted"
            >
              {showPassword ? "Sembunyi" : "Lihat"}
            </button>
          </div>

          {error && (
            <p className="rounded-card border border-primary-border bg-primary-soft px-4 py-3 text-sm text-[#ffb3a1]">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" disabled={loading} className="mt-2">
            {loading ? "Memproses..." : mode === "signin" ? "Masuk" : "Buat Akun"}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
          Versi MVP: belum ada reset password via email. Simpan passwordmu baik-baik.
        </p>
      </div>
    </main>
  );
}

function toMessage(message: string): Error {
  if (message.includes("Invalid login credentials")) {
    return new Error("Email atau password salah.");
  }
  if (message.includes("User already registered")) {
    return new Error("Email sudah terdaftar. Coba masuk.");
  }
  return new Error(message);
}
