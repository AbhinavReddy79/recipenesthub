import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Use "h1" when the empty state is the main content of the page. */
  headingLevel?: "h1" | "h2";
}

export function EmptyState({ icon: Icon, title, description, actions, children, className, headingLevel = "h2" }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        "relative isolate grid justify-items-center gap-4 overflow-hidden rounded-3xl bg-warm-glow px-6 py-14 text-center ring-1 ring-border/70",
        className,
      )}
    >
      <span className="relative flex size-16 items-center justify-center rounded-2xl bg-tone-soft text-tone animate-float">
        <span aria-hidden className="absolute -inset-2 -z-10 rounded-3xl border-2 border-dashed border-tone/25 animate-spin-slow" />
        <Icon className="size-8" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="grid max-w-md gap-2">
        <Heading className="text-2xl font-semibold">{title}</Heading>
        <div className="text-pretty text-muted-foreground">{description}</div>
      </div>
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
      {children}
    </div>
  );
}
