"use client";

import { ArrowDownUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/recipes/query";
import type { RecipeSort } from "@/types/recipe";

export function SortSelect({ value, onChange }: { value: RecipeSort; onChange: (sort: RecipeSort) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RecipeSort)}>
      <SelectTrigger className="min-w-44" aria-label="Sort recipes">
        <ArrowDownUp className="text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
