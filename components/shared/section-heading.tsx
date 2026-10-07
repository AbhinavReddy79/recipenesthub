import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** Short label above the title, in the brand colour. */
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  action,
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="grid max-w-2xl gap-2">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id} className="text-balance text-[1.875rem] leading-tight font-semibold sm:text-[2.375rem]">
          {title}
        </h2>
        {description && <p className="text-pretty text-[1.0625rem] text-muted-foreground">{description}</p>}
      </div>
      {action}
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-xs transition-colors hover:border-primary/40 hover:text-primary"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Small uppercase label with a short rule, used above section and page titles. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-xs font-bold tracking-[0.16em] text-tone uppercase",
        className,
      )}
    >
      <span aria-hidden className="h-0.5 w-6 origin-left rounded-full bg-tone animate-in zoom-in-0 duration-700" />
      {children}
    </p>
  );
}
