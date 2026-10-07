import type { ReactNode } from "react";
import { Check } from "lucide-react";

export function AuthSuccess({ title, description, actions }: { title: string; description: string; actions: ReactNode }) {
  return (
    <div role="status" className="grid justify-items-center gap-4 py-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-herb-soft text-herb animate-in zoom-in-50 duration-300">
        <Check className="size-7" aria-hidden />
      </span>
      <div className="grid gap-1.5">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">{actions}</div>
    </div>
  );
}
