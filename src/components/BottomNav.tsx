"use client";

import { CalendarDays, History, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Jadwal", Icon: CalendarDays },
  { href: "/riwayat", label: "Riwayat", Icon: History },
  { href: "/profil", label: "Profil", Icon: UserRound },
] as const;

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid h-16 max-w-[480px] grid-cols-3">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                  active ? "text-primary" : "text-ink-muted hover:text-white"
                }`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
