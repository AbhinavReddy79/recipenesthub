import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./section-heading";

interface PageHeaderProps {
  /** Short label above the title, in the module's accent colour. */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** A rendered icon (e.g. <CalendarDays />) shown as a floating badge on wide screens. */
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Colours come from the surrounding <ModuleTone> (defaults to the brand colour). */
export function PageHeader({ eyebrow, title, description, actions, icon, children, className }: PageHeaderProps) {
  return (
    <header className={cn("relative isolate overflow-hidden border-b bg-warm-glow", className)}>
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-dots [mask-image:linear-gradient(to_left,black,transparent)]"
      />
      {icon && <FloatingBadge icon={icon} />}
      <div className="container-page py-10 sm:py-14">
        <div className="grid max-w-2xl gap-3">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="text-balance text-[2.375rem] leading-[1.08] font-semibold sm:text-[3.25rem]">{title}</h1>
          {description && <p className="text-pretty text-base text-muted-foreground sm:text-lg">{description}</p>}
          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
}

/** A tilted, gently floating icon tile with a couple of confetti shapes around it. */
function FloatingBadge({ icon }: { icon: ReactNode }) {
  return (
    <div aria-hidden className="pointer-events-none absolute top-1/2 right-[7%] hidden -translate-y-1/2 lg:block">
      <div className="animate-pop [animation-delay:200ms]">
        <div className="relative animate-float-slow">
          <span className="absolute inset-0 -z-10 scale-[1.8] rounded-full bg-tone/25 blur-3xl" />
          <span className="flex size-28 rotate-6 items-center justify-center rounded-[2rem] bg-tone bg-gradient-to-br from-tone to-[color-mix(in_oklch,var(--tone),var(--saffron)_30%)] text-tone-foreground shadow-lift ring-8 ring-card/60 [&>svg]:size-12 [&>svg]:stroke-[1.5]">
            {icon}
          </span>
          <span className="absolute -bottom-4 -left-7 size-10 rotate-12 rounded-xl bg-saffron shadow-soft animate-bounce-soft" />
          <span className="absolute -top-5 -right-5 size-7 rounded-full bg-tone/45 animate-bounce-soft [animation-delay:600ms]" />
          <span className="absolute top-1/2 -left-12 size-3 rounded-full bg-herb/60" />
        </div>
      </div>
    </div>
  );
}
