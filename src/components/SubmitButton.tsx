"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Tombol submit untuk <form action={serverAction}> dengan status loading otomatis. */
export default function SubmitButton({
  children,
  className = "",
  pendingLabel,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`disabled:opacity-60 ${className}`}>
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
