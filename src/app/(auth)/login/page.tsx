"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";
import AuthShell from "../AuthShell";
import { Alert, Field, PasswordField, PrimaryButton } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <AuthShell mode="masuk">
      <form action={action} className="space-y-5" noValidate>
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
          autoComplete="current-password"
          placeholder="Password kamu"
          error={state.fieldErrors?.password}
          required
        />

        {state.error && <Alert>{state.error}</Alert>}

        <PrimaryButton type="submit" loading={pending} className="!mt-7">
          {pending ? "Masuk..." : "Masuk"}
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-secondary">
        Belum punya akun?{" "}
        <Link href="/daftar" replace className="font-bold text-primary">
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  );
}
