import { cn } from "@/lib/utils";

interface LogoProps {
  showWordmark?: boolean;
  className?: string;
  /** Also plays a short intro first (the mark settles in and the sprig grows). */
  animated?: boolean;
}

/**
 * RecipeNest mark: a bowl cradling a sprig, drawn in brand tokens, inside a
 * spinning magic circle. The sprig sways and the bowl shines, continuously.
 */
export function Logo({ showWordmark = true, className, animated = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3.5", animated && "logo-animated")}>
      <span className="relative isolate inline-flex shrink-0">
        <MagicCircle />
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

// Points of the two squares that form the eight-pointed star behind the bowl.
const STAR = [0, 45].map((turn) =>
  [0, 90, 180, 270]
    .map((deg) => {
      const a = ((deg + turn) * Math.PI) / 180;
      return `${(50 + 47 * Math.cos(a)).toFixed(2)},${(50 + 47 * Math.sin(a)).toFixed(2)}`;
    })
    .join(" "),
);
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

/**
 * A glowing spell circle around the mark: a runic outer ring spins one way,
 * an eight-pointed star the other, and sparks orbit. Rotation and opacity
 * only, so it stays smooth on phones.
 */
function MagicCircle() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="logo-portal pointer-events-none absolute -inset-[30%] -z-10 size-[160%] overflow-visible">
      <g className="logo-portal-cw" fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="48.5" strokeWidth="1.6" />
        <circle cx="50" cy="50" r="44.5" strokeWidth="1.1" strokeDasharray="2 2.4" />
        {TICKS.map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="1.5"
            x2="50"
            y2={deg % 45 === 0 ? 7.5 : 4.5}
            strokeWidth={deg % 45 === 0 ? 1.8 : 1}
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
      </g>
      <g className="logo-portal-ccw" fill="none" stroke="currentColor" strokeWidth="1.5">
        {STAR.map((points) => (
          <polygon key={points} points={points} />
        ))}
        <circle cx="50" cy="50" r="40.5" strokeWidth="0.9" />
      </g>
      <g className="logo-portal-sparks" fill="currentColor">
        <circle cx="50" cy="1.5" r="1.6" />
        <circle cx="50" cy="98.5" r="1.1" />
        <circle cx="1.5" cy="50" r="0.9" />
      </g>
    </svg>
  );
}
