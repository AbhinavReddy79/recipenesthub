"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ToolbarFilter {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

interface AdminToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  filters: ToolbarFilter[];
  resultCount: number;
  noun: string;
}

export function AdminToolbar({ search, onSearch, placeholder, filters, resultCount, noun }: AdminToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          className="pl-9"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {filters.map((filter) => (
        <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger aria-label={filter.label} className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <p className="w-full text-sm text-muted-foreground" aria-live="polite">
        {resultCount} {resultCount === 1 ? noun : `${noun}s`}
      </p>
    </div>
  );
}
