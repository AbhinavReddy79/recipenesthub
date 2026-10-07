import type { ReactNode } from "react";

export type Tone = "brand" | "herb" | "coral" | "berry" | "ocean" | "amber" | "red";

/**
 * Gives a module its accent colour. Everything inside can use `text-tone`,
 * `bg-tone`, `bg-tone-soft` and `text-tone-foreground`; buttons keep the brand colour.
 */
export function ModuleTone({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div data-tone={tone} className="contents">
      {children}
    </div>
  );
}
