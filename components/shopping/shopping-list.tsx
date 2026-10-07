"use client";

import Link from "next/link";
import {
  Beef,
  CalendarDays,
  CheckCheck,
  ClipboardCopy,
  Carrot,
  Flame,
  Milk,
  Package,
  PartyPopper,
  Plus,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import type { Tone } from "@/components/shared/module-tone";
import { ListSkeleton } from "@/components/shared/skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/use-catalog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMealPlan } from "@/hooks/use-meal-plan";
import { useRegion } from "@/hooks/use-region";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { formatQuantity, formatUnit } from "@/lib/format";
import { AISLES, buildShoppingList } from "@/lib/shopping";
import type { IngredientAisle, Recipe } from "@/types/recipe";
import { emptyItem, ItemFields, useItemForm } from "./item-fields";
import { ShoppingItem } from "./shopping-item";

/** Every aisle has its own colour and icon so the list scans at a glance. */
const AISLE_META: Record<IngredientAisle, { icon: LucideIcon; tone: Tone }> = {
  Produce: { icon: Carrot, tone: "herb" },
  Dairy: { icon: Milk, tone: "ocean" },
  Meat: { icon: Beef, tone: "red" },
  Grains: { icon: Wheat, tone: "amber" },
  Spices: { icon: Flame, tone: "berry" },
  Other: { icon: Package, tone: "coral" },
};

/** Circular progress that fills as items are checked off. */
function ProgressRing({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="progressbar"
      aria-label="Shopping progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="relative size-24 shrink-0"
    >
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={radius} strokeWidth="8" className="fill-none stroke-muted" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="fill-none stroke-tone transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  );
}

function AddItemForm() {
  const { add } = useShoppingList();
  const form = useItemForm(emptyItem, (input, { setValues }) => {
    add(input);
    setValues({ ...emptyItem, aisle: input.aisle });
    document.getElementById("add-item-name")?.focus();
  });
  return (
    <form onSubmit={form.submit} noValidate className="grid gap-2 rounded-2xl border bg-card p-3 shadow-card" aria-label="Add an item">
      <div className="grid gap-2 sm:flex">
        <ItemFields values={form.values} setValues={form.setValues} idPrefix="add-item" error={form.error} />
        <Button type="submit" className="h-10">
          <Plus />
          Add item
        </Button>
      </div>
      {form.error && (
        <p role="alert" className="px-1 text-[0.8125rem] text-destructive">
          {form.error}
        </p>
      )}
    </form>
  );
}

export function ShoppingList({ recipes: serverRecipes }: { recipes: Recipe[] }) {
  const hydrated = useHydrated();
  const { items, completed, remaining, merge, clearCompleted, clearAll } = useShoppingList();
  const { plan, mealCount } = useMealPlan();
  const { bySlug } = useCatalog(serverRecipes);
  const { region, price, format } = useRegion();

  const generate = () => {
    const generated = buildShoppingList(plan, bySlug);
    if (generated.length === 0) {
      toast("Your meal plan is empty", { description: "Add a few meals to the planner first." });
      return;
    }
    merge(generated);
    toast.success(`Added ingredients from ${mealCount} planned meals`);
  };

  const copy = async () => {
    const text = AISLES.map((aisle) => {
      const rows = items.filter((i) => i.aisle === aisle && !i.checked);
      if (!rows.length) return "";
      return `${aisle}\n${rows
        .map((i) => `- ${i.quantity !== null ? `${formatQuantity(i.quantity)} ${formatUnit(i.unit, i.quantity)} `.replace(/\s+$/, " ") : ""}${i.name}`)
        .join("\n")}`;
    })
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Shopping list copied");
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  if (!hydrated) return <ListSkeleton rows={8} />;

  // Estimated cost of the pantry products still to buy.
  const estimate = items.reduce((sum, i) => (i.product && !i.checked ? sum + price(i.product.price) * (i.quantity ?? 1) : sum), 0);

  const generateButton = (
    <Button onClick={generate} size="lg" variant={items.length ? "outline" : "default"}>
      <Sparkles data-icon="inline-start" />
      Generate from Meal Plan
    </Button>
  );

  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:gap-10">
      <div className="grid content-start gap-6">
        <AddItemForm />

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="Your shopping list is empty."
            description={
              mealCount > 0
                ? `You have ${mealCount} meals planned — turn them into a list in one click, or add items manually above.`
                : "Plan a few meals and generate a list automatically, or add items manually above."
            }
            actions={
              <>
                <Button size="lg" onClick={() => document.getElementById("add-item-name")?.focus()}>
                  <Plus data-icon="inline-start" />
                  Add Item
                </Button>
                {mealCount > 0 ? (
                  <Button size="lg" variant="outline" onClick={generate}>
                    <Sparkles data-icon="inline-start" />
                    Generate from Meal Plan
                  </Button>
                ) : (
                  <Button asChild size="lg" variant="outline">
                    <Link href="/meal-planner">
                      <CalendarDays data-icon="inline-start" />
                      Plan meals first
                    </Link>
                  </Button>
                )}
              </>
            }
          />
        ) : (
          <div className="grid gap-5">
            {AISLES.map((aisle) => {
              const rows = items
                .filter((i) => i.aisle === aisle)
                .sort((a, b) => Number(a.checked) - Number(b.checked) || a.name.localeCompare(b.name));
              if (!rows.length) return null;
              const left = rows.filter((r) => !r.checked).length;
              const { icon: Icon, tone } = AISLE_META[aisle];
              return (
                <section
                  key={aisle}
                  data-tone={tone}
                  aria-labelledby={`aisle-${aisle}`}
                  className="overflow-hidden rounded-2xl border bg-card shadow-card animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <header className="flex items-center gap-3 border-b bg-tone-soft px-4 py-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-tone text-tone-foreground shadow-soft">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <h2 id={`aisle-${aisle}`} className="font-sans text-[0.9375rem] font-bold tracking-normal">
                      {aisle}
                    </h2>
                    <span className="ml-auto rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-tone ring-1 ring-tone/20">
                      {left === 0 ? "All done" : `${left} of ${rows.length} left`}
                    </span>
                  </header>
                  <ul className="divide-y">
                    {rows.map((item) => (
                      <ShoppingItem key={item.id} item={item} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <aside className="order-first grid content-start gap-4 lg:sticky lg:top-24 lg:order-none lg:self-start" aria-label="List summary">
        <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-card">
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} />
            <div>
              <p className="font-display text-3xl font-semibold tabular-nums">
                {remaining}
                <span className="ml-1.5 font-sans text-base font-normal text-muted-foreground">to buy</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {completed} of {items.length} checked off
              </p>
            </div>
          </div>
          {estimate > 0 && (
            <p className="rounded-xl bg-surface px-3 py-2 text-sm text-muted-foreground">
              Pantry products: <span className="font-semibold text-foreground tabular-nums">{format(estimate)}</span> estimated · {region.name}
            </p>
          )}
          {items.length > 0 && remaining === 0 && (
            <p role="status" className="flex items-center gap-2 rounded-xl bg-herb-soft px-3 py-2.5 text-sm font-semibold text-herb animate-pop">
              <PartyPopper className="size-4 animate-wiggle" aria-hidden />
              All done — happy cooking!
            </p>
          )}
          {items.length > 0 && generateButton}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearCompleted} disabled={completed === 0}>
              <CheckCheck />
              Clear done
            </Button>
            <Button variant="outline" onClick={copy} disabled={remaining === 0}>
              <ClipboardCopy />
              Copy
            </Button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={items.length === 0}>
                <Trash2 />
                Clear entire list
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear your shopping list?</AlertDialogTitle>
                <AlertDialogDescription>All {items.length} items will be removed.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={clearAll}>
                  Clear list
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
    </div>
  );
}
