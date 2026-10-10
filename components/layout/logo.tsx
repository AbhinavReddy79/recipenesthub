import { cn } from "@/lib/utils";

interface LogoProps {
  showWordmark?: boolean;
  className?: string;
  /** Also plays a short intro first (the mark settles in and the sprig grows). */
  animated?: boolean;
}

/** RecipeNest mark: a bowl cradling a sprig, drawn in brand tokens. The sprig sways and the bowl shines, continuously. */
export function Logo({ showWordmark = true, className, animated = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", animated && "logo-animated")}>
      <span
        className={cn(
          "logo-mark relative flex size-10 shrink-0 overflow-hidden items-center justify-center rounded-xl bg-metallic-gold text-[oklch(0.2_0.006_70)] shadow-[0_6px_18px_-6px_var(--gold-deep),inset_0_1px_0_oklch(1_0_0/0.45)] ring-2 ring-saffron/40 ring-offset-2 ring-offset-background transition-transform duration-300 group-hover/logo:-rotate-6 group-hover/logo:scale-110",
          className,
        )}
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="size-[62%]" fill="none">
          <path d="M5 15.5h22c0 6.1-4.9 11-11 11s-11-4.9-11-11Z" fill="currentColor" />
          <path
            className="logo-leaf logo-leaf-big fill-[oklch(0.2_0.006_70)]"
            d="M16 14c0-4.2 2.6-7.4 6.5-8.5-.3 4.3-2.9 7.6-6.5 8.5Z"
          />
          <path
            className="logo-leaf logo-leaf-small"
            d="M16 14c0-3-1.8-5.4-4.6-6.3.1 3.1 2 5.6 4.6 6.3Z"
            fill="currentColor"
            opacity="0.75"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="font-display text-[1.5rem] font-bold leading-none tracking-tight">
          Recipe
          <span className="text-metallic-gold logo-wordmark-gold">Nest</span>
        </span>
      )}
    </span>
  );
}
