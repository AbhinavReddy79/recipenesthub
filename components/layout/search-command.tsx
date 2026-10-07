"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Carrot, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/shared/kbd";

export interface SearchIndexItem {
  slug: string;
  title: string;
  image: string;
  meta: string;
  keywords: string;
}

const POPULAR = ["Chicken", "Pasta", "Biryani", "Desserts", "Vegetarian"];

export function SearchCommand({ index }: { index: SearchIndexItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, [contenteditable=true]");
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const trimmed = query.trim();

  return (
    <>
      <Button
        variant="ghost"
        className="hidden h-9 w-56 justify-start gap-2 rounded-full border border-border bg-card px-3 text-muted-foreground shadow-xs hover:bg-muted xl:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm font-normal">Search recipes…</span>
        <Kbd>/</Kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="xl:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search recipes"
      >
        <Search className="size-[1.15rem]" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search RecipeNest</DialogTitle>
          <DialogDescription className="sr-only">
            Search recipes by name, ingredient, cuisine or diet.
          </DialogDescription>
          <Command className="rounded-none bg-popover" loop>
            <div className="border-b p-2">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="What are you craving?"
                onKeyDown={(e) => {
                  // Enter with no highlighted recipe runs a full search.
                  if (e.key === "Enter" && trimmed && !document.querySelector("[cmdk-item][data-selected=true]")) {
                    go(`/search?q=${encodeURIComponent(trimmed)}`);
                  }
                }}
              />
            </div>
            <CommandList className="max-h-[min(60vh,420px)] p-1">
              <CommandEmpty className="py-8 text-sm text-muted-foreground">
                No quick matches. Press Enter to search everything.
              </CommandEmpty>
              {trimmed && (
                <CommandGroup>
                  <CommandItem
                    value={`search-all ${trimmed}`}
                    onSelect={() => go(`/search?q=${encodeURIComponent(trimmed)}`)}
                    className="gap-3 py-2.5"
                  >
                    <Search className="text-primary" />
                    <span>
                      Search all recipes for <strong className="font-semibold">“{trimmed}”</strong>
                    </span>
                    <ArrowRight className="ml-auto" />
                  </CommandItem>
                </CommandGroup>
              )}
              {!trimmed && (
                <>
                  <CommandGroup heading="Popular searches">
                    {POPULAR.map((term) => (
                      <CommandItem
                        key={term}
                        value={`popular ${term}`}
                        onSelect={() => go(`/search?q=${encodeURIComponent(term.toLowerCase())}`)}
                      >
                        <TrendingUp className="text-muted-foreground" />
                        {term}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="my-1" />
                  <CommandGroup heading="Shortcuts">
                    <CommandItem value="shortcut ingredients" onSelect={() => go("/ingredients")}>
                      <Carrot className="text-muted-foreground" />
                      Cook with what you have
                    </CommandItem>
                    <CommandItem value="shortcut planner" onSelect={() => go("/meal-planner")}>
                      <CalendarDays className="text-muted-foreground" />
                      Open meal planner
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
              {trimmed && (
                <CommandGroup heading="Recipes">
                  {index.map((item) => (
                    <CommandItem
                      key={item.slug}
                      value={`${item.title} ${item.keywords}`}
                      onSelect={() => go(`/recipes/${item.slug}`)}
                      className="gap-3 py-2"
                    >
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                      <span className="grid min-w-0">
                        <span className="truncate font-medium">{item.title}</span>
                        <span className="truncate text-xs text-muted-foreground">{item.meta}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
