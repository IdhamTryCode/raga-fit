"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Keluar"
      className="flex size-10 items-center justify-center rounded-full border border-line bg-card text-ink-secondary transition hover:text-white"
    >
      <LogOut className="size-4" />
    </button>
  );
}
