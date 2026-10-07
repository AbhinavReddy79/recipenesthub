"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChefHat, Heart, ListChecks, PartyPopper, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatIngredientName, formatQuantity, formatUnit } from "@/lib/format";
import { scaleQuantity } from "@/lib/recipes/query";
import { useFavorites } from "@/hooks/use-favorites";
import { cookedStorage } from "@/lib/storage/reviews";
import { REVIEW_FORM_ID } from "./recipe-reviews";
import { useRecipeSession } from "./recipe-session";
import { StepTimer } from "./step-timer";

/** Keeps the screen awake while cooking, where the browser supports it. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      .request("screen")
      .then((l) => {
        lock = l;
      })
      .catch(() => {});
    return () => {
      void lock?.release();
    };
  }, [active]);
}

export function CookingMode() {
  const { recipe, servings, cooking, setCooking } = useRecipeSession();
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(recipe.slug);
  const [index, setIndex] = useState(0);
  const total = recipe.steps.length;
  const finished = index >= total;
  const step = recipe.steps[Math.min(index, total - 1)];

  useWakeLock(cooking);

  // Remember that this cook finished the recipe, so they can review it.
  useEffect(() => {
    if (cooking && finished) cookedStorage.markCooked(recipe.slug);
  }, [cooking, finished, recipe.slug]);

  const rate = () => {
    open(false);
    window.setTimeout(() => {
      const form = document.getElementById(REVIEW_FORM_ID) ?? document.getElementById("reviews");
      form?.scrollIntoView({ behavior: "smooth", block: "center" });
      form?.querySelector<HTMLElement>('[role="radio"][tabindex="0"], button')?.focus({ preventScroll: true });
    }, 350);
  };

  const open = (value: boolean) => {
    setCooking(value);
    if (value) setIndex(0);
  };

  useEffect(() => {
    if (!cooking) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((i) => Math.min(total, i + 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cooking, total]);

  const progress = finished ? 100 : ((index + 1) / total) * 100;

  return (
    <Dialog open={cooking} onOpenChange={open}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-background p-0 ring-0 sm:max-w-none data-open:zoom-in-100 data-open:slide-in-from-bottom-4"
      >
        <header className="border-b">
          <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
            <ChefHat className="size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate font-sans text-sm font-semibold">{recipe.title}</DialogTitle>
              <DialogDescription className="text-xs">
                {finished ? "All steps complete" : `Step ${index + 1} of ${total}`}
              </DialogDescription>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Show ingredients">
                  <ListChecks />
                  <span className="hidden sm:inline">Ingredients</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="z-[60] w-[88%] max-w-sm gap-0 p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle className="font-sans text-lg">Ingredients</SheetTitle>
                  <SheetDescription>For {servings} servings</SheetDescription>
                </SheetHeader>
                <ul className="divide-y overflow-y-auto px-4">
                  {recipe.ingredients.map((ing) => {
                    const q = scaleQuantity(ing.quantity, recipe.servings, servings);
                    return (
                      <li key={ing.id} className="py-3 text-[0.9375rem]">
                        {q !== null && (
                          <strong className="font-semibold">
                            {formatQuantity(q)}
                            {ing.unit && ` ${formatUnit(ing.unit, q)}`}{" "}
                          </strong>
                        )}
                        {formatIngredientName(ing.name, q, ing.unit)}
                      </li>
                    );
                  })}
                </ul>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="sm" onClick={() => open(false)}>
              <X />
              Exit<span className="hidden sm:inline"> Cooking Mode</span>
            </Button>
          </div>
          <Progress value={progress} className="h-1 rounded-none" aria-label="Cooking progress" />
        </header>

        <main className="flex flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl flex-col justify-center px-5 py-10 sm:px-8">
            {finished ? (
              <div className="grid justify-items-center gap-5 text-center animate-fade-up">
                <span className="flex size-16 items-center justify-center rounded-full bg-herb-soft text-herb">
                  <PartyPopper className="size-8" aria-hidden />
                </span>
                <p className="font-display text-4xl font-semibold sm:text-5xl" role="status">
                  Recipe Complete
                </p>
                <p className="max-w-md text-lg text-muted-foreground">
                  You&apos;ve finished all {total} steps of {recipe.title}. Enjoy your meal!
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="lg" onClick={rate}>
                    <Star data-icon="inline-start" />
                    Rate this recipe
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setIndex(0)}>
                    Start over
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => toggle(recipe.slug, recipe.title)}
                    aria-pressed={saved}
                  >
                    <Heart className={saved ? "fill-current" : undefined} data-icon="inline-start" />
                    {saved ? "Saved to cookbook" : "Save this recipe"}
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => open(false)}>
                    Back to recipe
                  </Button>
                </div>
              </div>
            ) : (
              <div key={step.id} className="grid gap-8 animate-fade-up">
                <p className="text-sm font-semibold tracking-[0.14em] text-primary uppercase">
                  Step {index + 1} of {total}
                </p>
                <p
                  className="font-display text-[1.75rem] leading-snug font-medium text-balance sm:text-4xl sm:leading-tight lg:text-[2.75rem]"
                  aria-live="polite"
                >
                  {step.text}
                </p>
                {step.timerMinutes && <StepTimer key={step.id} minutes={step.timerMinutes} />}
              </div>
            )}
          </div>
        </main>

        <footer className="border-t bg-surface pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="min-w-28"
            >
              <ArrowLeft data-icon="inline-start" />
              Previous
            </Button>
            <div className="hidden gap-1.5 sm:flex" aria-hidden>
              {recipe.steps.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : i < index ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>
            {finished ? (
              <Button size="lg" onClick={() => open(false)} className="min-w-28">
                Done
              </Button>
            ) : (
              <Button size="lg" onClick={() => setIndex((i) => i + 1)} className="min-w-28">
                {index === total - 1 ? "Finish" : "Next"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
