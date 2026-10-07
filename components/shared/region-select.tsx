"use client";

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegion } from "@/hooks/use-region";
import { detectRegion, getRegion, isRegionCode, REGIONS } from "@/lib/regions";

const AUTO = "auto";

/** Picks the region used for pantry prices and pack sizes. */
export function RegionSelect({ id, className, onChanged }: { id?: string; className?: string; onChanged?: (name: string) => void }) {
  const { region, isAuto, setRegion } = useRegion();
  return (
    <Select
      value={isAuto ? AUTO : region.code}
      onValueChange={(v) => {
        const code = isRegionCode(v) ? v : null;
        setRegion(code);
        onChanged?.(getRegion(code ?? detectRegion()).name);
      }}
    >
      <SelectTrigger id={id} className={className} aria-label="Region for prices">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={AUTO}>Automatic ({isAuto ? region.name : getRegion(detectRegion()).name})</SelectItem>
        <SelectSeparator />
        {REGIONS.map((r) => (
          <SelectItem key={r.code} value={r.code}>
            {r.name} · {r.currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
