import { Timer } from "lucide-react";
import { formatMinutes } from "@/lib/format";
import type { InstructionStep } from "@/types/recipe";

export function InstructionSteps({ steps }: { steps: InstructionStep[] }) {
  return (
    <ol className="grid gap-3">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="grid grid-cols-[2.75rem_1fr] gap-x-4 rounded-2xl p-4 transition-colors hover:bg-surface sm:p-5 print:p-1"
        >
          <span
            className="flex size-11 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground tabular-nums shadow-glow print:size-auto print:bg-transparent print:text-black print:shadow-none"
            aria-hidden
          >
            {index + 1}
          </span>
          <div className="grid gap-2 pt-1.5">
            <span className="sr-only">Step {index + 1}: </span>
            <p className="text-pretty text-[1.0625rem] leading-relaxed">{step.text}</p>
            {step.timerMinutes && (
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                <Timer className="size-3.5" aria-hidden />
                Timer: {formatMinutes(step.timerMinutes)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
