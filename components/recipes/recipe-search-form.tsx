"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecipeSearchFormProps {
  defaultValue?: string;
  placeholder?: string;
  /** Called on submit instead of navigating to /search. */
  onSearch?: (query: string) => void;
  /** Called on every keystroke (for live-filtering pages). */
  onQueryChange?: (query: string) => void;
  size?: "md" | "lg";
  autoFocus?: boolean;
  className?: string;
  label?: string;
  /** Optional typeahead suggestions (rendered as a native datalist). */
  suggestions?: string[];
}

/** The search bar used on the homepage, discover and search pages. */
export function RecipeSearchForm({
  defaultValue = "",
  placeholder = "What are you craving?",
  onSearch,
  onQueryChange,
  size = "lg",
  autoFocus,
  className,
  label = "Search recipes",
  suggestions,
}: RecipeSearchFormProps) {
  const [query, setQuery] = useState(defaultValue);
  const inputId = `search-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const listId = suggestions?.length ? `${inputId}-suggestions` : undefined;
  const router = useRouter();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (onSearch) onSearch(trimmed);
    else router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const update = (value: string) => {
    setQuery(value);
    onQueryChange?.(value);
  };

  return (
    <form role="search" onSubmit={submit} className={cn("relative w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "lg" ? "left-4 size-5" : "left-4 size-[1.1rem]",
        )}
        aria-hidden
      />
      <input
        id={inputId}
        type="search"
        list={listId}
        value={query}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          "w-full rounded-full border border-input bg-card text-foreground shadow-card transition outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 [&::-webkit-search-cancel-button]:hidden",
          size === "lg" ? "h-14 pl-12 text-base" : "h-12 pl-11 text-[0.9375rem]",
          // Leave room for the clear button only while there is something to clear.
          size === "lg" ? (query ? "pr-40" : "pr-32") : query ? "pr-36" : "pr-28",
        )}
      />
      {query && (
        <button
          type="button"
          onClick={() => update("")}
          className={cn(
            "absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground",
            size === "lg" ? "right-[7.25rem]" : "right-[6.25rem]",
          )}
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
      {listId && (
        <datalist id={listId}>
          {suggestions?.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      <Button
        type="submit"
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full shadow-none",
          size === "lg" ? "right-1.5 h-11 px-6 text-[0.9375rem]" : "right-1.5 h-9 px-5",
        )}
      >
        Search
      </Button>
    </form>
  );
}
