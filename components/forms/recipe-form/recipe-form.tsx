"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert, FileText, PartyPopper, Rocket, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { userRecipeActions } from "@/hooks/use-user-recipes";
import {
  draftFromRecipe,
  draftToRecipe,
  emptyDraft,
  isRecipeDraft,
  validateDraftStep,
  type RecipeDraft,
  type StepErrors,
} from "@/lib/recipes/draft";
import { recipeFormAutosave } from "@/lib/storage/recipes";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeStatus } from "@/types/recipe";
import type { UserProfile } from "@/types/user";
import { IngredientEditor } from "../ingredient-editor";
import { InstructionEditor } from "../instruction-editor";
import { BasicsStep } from "./basics-step";
import { DetailsStep } from "./details-step";
import { PreviewStep } from "./preview-step";

const STEPS = [
  { title: "Basics", description: "Name, photo and the essentials." },
  { title: "Ingredients", description: "Everything a cook needs to buy." },
  { title: "Instructions", description: "Clear steps, in order. Reorder with the arrows." },
  { title: "Details", description: "Timing, servings, diet and nutrition." },
  { title: "Preview", description: "Check how your recipe will look." },
  { title: "Publish", description: "Share it with the community or keep it as a draft." },
];
const EDITABLE_STEPS = 4;
/** Multi-step create/edit form for the signed-in author. Render only after hydration (it reads localStorage on init). */
export function RecipeForm({ existing, profile }: { existing?: Recipe; profile: UserProfile }) {
  const [restored] = useState(() => {
    if (existing) return null;
    const saved = recipeFormAutosave.load(isRecipeDraft);
    // Merge over an empty draft so drafts saved by older versions gain new fields.
    return saved ? { ...emptyDraft(), ...saved } : null;
  });
  const [draft, setDraft] = useState<RecipeDraft>(() => (existing ? draftFromRecipe(existing) : restored ?? emptyDraft()));
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(existing ? STEPS.length - 1 : 0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [done, setDone] = useState<Recipe | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Autosave in-progress new recipes so a refresh doesn't lose work.
  useEffect(() => {
    if (existing || done) return;
    recipeFormAutosave.save(draft);
  }, [draft, existing, done]);

  const update = (patch: Partial<RecipeDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const preview = useMemo(
    () => draftToRecipe(draft, { status: "published", existing, profile }),
    [draft, existing, profile],
  );

  const goTo = (target: number) => {
    setStep(target);
    setMaxVisited((m) => Math.max(m, target));
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showErrors = (stepErrors: StepErrors) => {
    setErrors(stepErrors);
    toast.error("Please fix the highlighted fields.");
    requestAnimationFrame(() => {
      const first = document.querySelector<HTMLElement>("[aria-invalid=true]");
      first?.focus();
    });
  };

  const next = () => {
    if (step < EDITABLE_STEPS) {
      const stepErrors = validateDraftStep(step, draft);
      if (Object.keys(stepErrors).length) return showErrors(stepErrors);
    }
    goTo(step + 1);
  };

  const jump = (target: number) => {
    if (target <= maxVisited) return goTo(target);
    for (let s = step; s < target && s < EDITABLE_STEPS; s++) {
      const stepErrors = validateDraftStep(s, draft);
      if (Object.keys(stepErrors).length) {
        if (s !== step) goTo(s);
        return showErrors(stepErrors);
      }
    }
    goTo(target);
  };

  const save = (status: RecipeStatus) => {
    if (status === "published") {
      for (let s = 0; s < EDITABLE_STEPS; s++) {
        const stepErrors = validateDraftStep(s, draft);
        if (Object.keys(stepErrors).length) {
          goTo(s);
          return showErrors(stepErrors);
        }
      }
    } else if (draft.title.trim().length < 3) {
      goTo(0);
      return showErrors({ title: "Add a title before saving a draft." });
    }
    const recipe = draftToRecipe(draft, { status, existing, profile });
    userRecipeActions.save(recipe);
    if (!existing) recipeFormAutosave.clear();
    setDone(recipe);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    const published = done.status === "published";
    return (
      <div className="grid justify-items-center gap-6 rounded-2xl border bg-card px-6 py-16 text-center animate-fade-up">
        <span className="flex size-16 items-center justify-center rounded-full bg-herb-soft text-herb">
          {published ? <PartyPopper className="size-8" aria-hidden /> : <Save className="size-7" aria-hidden />}
        </span>
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold">{published ? (existing ? "Recipe updated!" : "Your recipe is live!") : "Draft saved"}</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            {published
              ? `“${done.title}” now appears in My Recipes, Recipes and Search on this device.`
              : `“${done.title}” is saved in your drafts. Finish it whenever you're ready.`}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild size="lg">
            <Link href={`/recipes/${done.slug}`}>View recipe</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/my-recipes">Go to My Recipes</Link>
          </Button>
          {!existing && (
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setDraft(emptyDraft());
                setDone(null);
                setStep(0);
                setMaxVisited(0);
              }}
            >
              Create another
            </Button>
          )}
        </div>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div ref={topRef} className="grid scroll-mt-24 gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
      <nav aria-label="Form steps" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <ol className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:grid lg:gap-1">
          {STEPS.map((s, i) => {
            const complete = i < step || (i <= maxVisited && i !== step);
            return (
              <li key={s.title} className="shrink-0">
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    i === step ? "bg-card font-semibold shadow-card ring-1 ring-primary/30" : "text-muted-foreground hover:bg-card hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                      i === step && "scale-110 border-primary bg-primary text-primary-foreground shadow-glow",
                      complete && i !== step && "border-herb bg-herb text-herb-foreground",
                    )}
                  >
                    {complete && i !== step ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        {restored && step === 0 && (
          <p className="mt-4 hidden rounded-lg bg-muted p-3 text-xs text-muted-foreground lg:block">
            We restored your unfinished recipe from last time.
          </p>
        )}
      </nav>

      <section aria-labelledby="step-title" className="min-w-0 rounded-3xl border bg-card p-5 shadow-card sm:p-8">
        <Progress value={((step + 1) / STEPS.length) * 100} aria-label="Recipe form progress" className="mb-6" />
        <header className="mb-8 grid gap-1 border-b pb-6">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 id="step-title" className="text-2xl font-semibold sm:text-3xl">
            {STEPS[step].title}
          </h2>
          <p className="text-muted-foreground">{STEPS[step].description}</p>
        </header>

        {errorCount > 0 && (
          <div role="alert" className="mb-6 flex gap-2.5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {errorCount === 1 ? "One field needs attention." : `${errorCount} fields need attention.`}
          </div>
        )}

        <div key={step} className="animate-fade-up">
          {step === 0 && <BasicsStep draft={draft} update={update} errors={errors} />}
          {step === 1 && <IngredientEditor value={draft.ingredients} onChange={(ingredients) => update({ ingredients })} errors={errors} />}
          {step === 2 && <InstructionEditor value={draft.steps} onChange={(steps) => update({ steps })} errors={errors} />}
          {step === 3 && <DetailsStep draft={draft} update={update} errors={errors} />}
          {step === 4 && <PreviewStep recipe={preview} />}
          {step === 5 && (
            <div className="grid gap-6">
              <ul className="grid gap-2 text-sm">
                {[
                  `Title: ${preview.title}`,
                  `${preview.ingredients.length} ingredients · ${preview.steps.length} steps`,
                  `Serves ${preview.servings} · ${preview.prepMinutes + preview.cookMinutes} minutes total`,
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <Check className="size-4 text-herb" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => save("published")}
                  className="grid gap-2 rounded-2xl border-2 border-primary bg-accent p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <Rocket className="size-6 text-primary" aria-hidden />
                  <span className="text-lg font-semibold">{existing ? "Save & publish" : "Publish now"}</span>
                  <span className="text-sm text-muted-foreground">Visible in My Recipes, Recipes and Search.</span>
                </button>
                <button
                  type="button"
                  onClick={() => save("draft")}
                  className="grid gap-2 rounded-2xl border-2 bg-card p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-amber/60 hover:shadow-lift"
                >
                  <FileText className="size-6 text-amber" aria-hidden />
                  <span className="text-lg font-semibold">Save as draft</span>
                  <span className="text-sm text-muted-foreground">Only you can see it. Publish later.</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>
            <ArrowLeft />
            Back
          </Button>
          <div className="flex gap-2">
            {step < 5 && (
              <Button type="button" variant="outline" onClick={() => save("draft")}>
                <Save />
                <span className="hidden sm:inline">Save draft</span>
              </Button>
            )}
            {step < 5 && (
              <Button type="button" onClick={next}>
                {step === 4 ? "Continue to publish" : "Next"}
                <ArrowRight />
              </Button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
