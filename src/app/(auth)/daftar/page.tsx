"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type AuthState } from "../actions";
import AuthShell from "../AuthShell";
import { Alert, Field, PasswordField, PrimaryButton } from "@/components/ui";

const MIN_PASSWORD = 8;

export default function DaftarPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  // Cek kecocokan password langsung saat mengetik, sebelum dikirim.
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const liveMismatch = confirm.length > 0 && confirm !== password ? "Password tidak sama." : undefined;

  return (
    <AuthShell mode="daftar">
      <form action={action} className="space-y-5" noValidate>
        <Field
          label="Nama panggilan"
          name="name"
          autoComplete="given-name"
          placeholder="Mis. Sarah"
          maxLength={40}
          defaultValue={state.values?.name}
          error={state.fieldErrors?.name}
          required
        />
        <Field
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="nama@email.com"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder={`Minimal ${MIN_PASSWORD} karakter`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={state.fieldErrors?.password}
          hint={`Minimal ${MIN_PASSWORD} karakter`}
          required
        />
        <PasswordField
          label="Konfirmasi password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Ulangi password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={liveMismatch ?? state.fieldErrors?.confirm}
          required
        />

        {state.error && <Alert>{state.error}</Alert>}
        {state.info && <Alert tone="info">{state.info}</Alert>}

        <PrimaryButton type="submit" loading={pending} className="!mt-7">
          {pending ? "Membuat akun..." : "Daftar"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-secondary">
        Sudah punya akun?{" "}
        <Link href="/login" replace className="font-bold text-primary">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
