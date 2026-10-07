"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, CATEGORY_SLUGS, CUISINE_LABELS, CUISINE_SLUGS } from "@/lib/labels";
import { DIFFICULTIES, MEAL_TYPES } from "@/lib/recipes/query";
import type { RecipeDraft, StepErrors } from "@/lib/recipes/draft";
import { ChoiceSelect } from "../choice-select";
import { FormField } from "../form-field";
import { ImagePicker } from "../image-picker";

interface StepProps {
  draft: RecipeDraft;
  update: (patch: Partial<RecipeDraft>) => void;
  errors: StepErrors;
}

export function BasicsStep({ draft, update, errors }: StepProps) {
  return (
    <div className="grid gap-6">
      <FormField id="title" label="Recipe title" required error={errors.title}>
        {(c) => (
          <Input {...c} maxLength={90} placeholder="e.g. Grandma's Sunday Lasagna" value={draft.title} onChange={(e) => update({ title: e.target.value })} />
        )}
      </FormField>
      <FormField
        id="description"
        label="Description"
        required
        error={errors.description}
        hint={`${draft.description.length}/280 — what makes this recipe special?`}
      >
        {(c) => (
          <Textarea
            {...c}
            rows={3}
            maxLength={280}
            placeholder="A short, mouth-watering summary."
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        )}
      </FormField>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium">
          Photo<span className="text-primary" aria-hidden>*</span>
        </span>
        <ImagePicker id="image" value={draft.image} onChange={(image) => update({ image })} error={errors.image} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="cuisine" label="Cuisine" required error={errors.cuisine}>
          {(c) => (
            <ChoiceSelect
              control={c}
              value={draft.cuisine}
              onChange={(cuisine) => update({ cuisine })}
              placeholder="Choose a cuisine"
              options={CUISINE_SLUGS.map((s) => ({ value: s, label: CUISINE_LABELS[s] }))}
            />
          )}
        </FormField>
        <FormField id="category" label="Category" required error={errors.category}>
          {(c) => (
            <ChoiceSelect
              control={c}
              value={draft.category}
              onChange={(category) => update({ category })}
              placeholder="Choose a category"
              options={CATEGORY_SLUGS.map((s) => ({ value: s, label: CATEGORY_LABELS[s] }))}
            />
          )}
        </FormField>
        <FormField id="mealType" label="Meal type" required error={errors.mealType}>
          {(c) => (
            <ChoiceSelect
              control={c}
              value={draft.mealType}
              onChange={(mealType) => update({ mealType })}
              placeholder="Choose a meal type"
              options={MEAL_TYPES.map((m) => ({ value: m, label: m }))}
            />
          )}
        </FormField>
        <FormField id="difficulty" label="Difficulty" required error={errors.difficulty}>
          {(c) => (
            <ChoiceSelect
              control={c}
              value={draft.difficulty}
              onChange={(difficulty) => update({ difficulty })}
              placeholder="How hard is it?"
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
            />
          )}
        </FormField>
      </div>
    </div>
  );
}

export type { StepProps };
