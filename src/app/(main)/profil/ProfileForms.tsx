"use client";

import { Check } from "lucide-react";
import { useActionState, useOptimistic, useTransition } from "react";
import { Field } from "@/components/ui";
import { updateName, updateWeightStep, type ProfileState } from "./actions";

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateName, {});
  return (
    <form action={action} className="flex items-end gap-2">
      <Field label="Nama panggilan" name="name" defaultValue={name} maxLength={40} error={state.error} className="flex-1" />
      <button
        type="submit"
        disabled={pending}
        className="flex h-14 min-w-20 items-center justify-center gap-1 rounded-2xl bg-interactive px-4 text-sm font-bold disabled:opacity-60"
      >
        {state.ok && !pending ? <><Check className="size-4 text-success" /> Oke</> : pending ? "..." : "Simpan"}
      </button>
    </form>
  );
}

export function WeightStepPicker({ step }: { step: number }) {
  const [optimistic, setOptimistic] = useOptimistic(step);
  const [, startTransition] = useTransition();
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">Kenaikan beban per tap</p>
      <div className="grid h-14 grid-cols-3 rounded-2xl bg-surface/60 p-1.5" role="radiogroup" aria-label="Kenaikan beban">
        {[1, 2.5, 5].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={optimistic === s}
            onClick={() =>
              startTransition(async () => {
                setOptimistic(s);
                await updateWeightStep(s);
              })
            }
            className={`rounded-xl text-sm font-bold transition ${optimistic === s ? "bg-primary text-white" : "text-ink-muted"}`}
          >
            {s.toLocaleString("id-ID")} kg
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[13px] text-ink-muted">Angka beban juga bisa diketuk untuk diketik langsung.</p>
    </div>
  );
}
