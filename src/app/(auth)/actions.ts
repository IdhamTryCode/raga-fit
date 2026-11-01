"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  values?: { name?: string; email?: string };
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "confirm", string>>;
  error?: string;
  info?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// File "use server" hanya boleh mengekspor fungsi async.
const MIN_PASSWORD = 8;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Format email belum benar.";
  if (!password) fieldErrors.password = "Password wajib diisi.";
  if (Object.keys(fieldErrors).length) return { values, fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { values, error: translate(error.message, error.code) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("program_started_on")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(profile?.program_started_on ? "/dashboard" : "/onboarding");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const values = { name, email };

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = "Isi nama panggilanmu (min. 2 huruf).";
  else if (name.length > 40) fieldErrors.name = "Nama maksimal 40 karakter.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Format email belum benar.";
  if (password.length < MIN_PASSWORD) fieldErrors.password = `Password minimal ${MIN_PASSWORD} karakter.`;
  if (!confirm) fieldErrors.confirm = "Ulangi password-mu.";
  else if (confirm !== password) fieldErrors.confirm = "Password tidak sama.";
  if (Object.keys(fieldErrors).length) return { values, fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
  if (error) return { values, error: translate(error.message, error.code) };

  // Supabase menyamarkan email yang sudah terdaftar: user tanpa identitas.
  if (data.user && data.user.identities?.length === 0) {
    return { values, error: "Email sudah terdaftar. Silakan masuk." };
  }

  // Bila konfirmasi email aktif di Supabase, belum ada sesi.
  if (!data.session) {
    return { values, info: "Akun dibuat. Cek email untuk konfirmasi, lalu masuk." };
  }

  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

function translate(message: string, code?: string): string {
  const m = message.toLowerCase();
  if (code === "invalid_credentials" || m.includes("invalid login credentials"))
    return "Email atau password salah.";
  if (code === "email_not_confirmed" || m.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Cek kotak masuk email-mu.";
  if (code === "user_already_exists" || m.includes("already registered"))
    return "Email sudah terdaftar. Silakan masuk.";
  if (code === "weak_password" || m.includes("password should"))
    return "Password terlalu lemah. Pakai kombinasi huruf dan angka.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || m.includes("rate limit"))
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (m.includes("fetch") || m.includes("network"))
    return "Tidak bisa terhubung ke server. Periksa koneksi internet.";
  return "Terjadi kesalahan. Coba lagi sebentar lagi.";
}
