import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ProfileStat {
  label: string;
  value: number;
  /** Custom rendering for the value (e.g. a live count). */
  display?: ReactNode;
}

/** Each tile cycles through the module accents. */
const TONES = ["red", "ocean", "herb", "berry", "amber"] as const;

export function ProfileStats({ stats, className }: { stats: ProfileStat[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-3 sm:flex sm:flex-wrap", className)}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          data-tone={TONES[i % TONES.length]}
          className="grid min-w-36 gap-0.5 rounded-2xl border border-tone/15 bg-tone-soft px-5 py-3.5 transition duration-300 animate-rise hover:-translate-y-0.5 hover:shadow-card"
          style={{ animationDelay: `${150 + i * 90}ms` }}
        >
          <dt className="text-sm font-medium text-muted-foreground">{stat.label}</dt>
          <dd className="order-first font-display text-3xl font-semibold text-tone tabular-nums">
            {stat.display ?? formatCount(stat.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
