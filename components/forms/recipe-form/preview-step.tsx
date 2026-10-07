import Image from "next/image";
import { Clock, Users } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { Badge } from "@/components/ui/badge";
import { formatIngredientName, formatMinutes, formatQuantity, formatUnit } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import type { Recipe } from "@/types/recipe";

/** How the recipe will look once published: the card, plus the full page layout in miniature. */
export function PreviewStep({ recipe }: { recipe: Recipe }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div className="grid content-start gap-3">
        <p className="text-sm font-medium text-muted-foreground">As a card</p>
        <RecipeCard recipe={recipe} showFavorite={false} sizes="280px" />
      </div>
      <div className="grid content-start gap-3">
        <p className="text-sm font-medium text-muted-foreground">On the recipe page</p>
        <article className="overflow-hidden rounded-2xl border bg-card">
          {recipe.image && (
            <div className="relative aspect-[16/8] bg-muted">
              <Image src={recipe.image} alt="" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
            </div>
          )}
          <div className="grid gap-5 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{CUISINE_LABELS[recipe.cuisine]}</Badge>
              <Badge variant="outline">{recipe.mealType}</Badge>
              <Badge variant="outline">{recipe.difficulty}</Badge>
              {recipe.diets.map((d) => (
                <Badge key={d} variant="outline">
                  {d}
                </Badge>
              ))}
            </div>
            <div className="grid gap-2">
              <h3 className="text-3xl font-semibold">{recipe.title}</h3>
              <p className="text-muted-foreground">{recipe.description}</p>
            </div>
            <p className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                {formatMinutes(totalMinutes(recipe))} total
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" aria-hidden />
                Serves {recipe.servings}
              </span>
            </p>
            <div className="grid gap-6 border-t pt-5 sm:grid-cols-[1fr_1.4fr]">
              <div>
                <h4 className="mb-2 font-sans text-sm font-semibold">Ingredients ({recipe.ingredients.length})</h4>
                <ul className="grid gap-1.5 text-sm">
                  {recipe.ingredients.map((i) => (
                    <li key={i.id}>
                      {i.quantity !== null && (
                        <strong>
                          {formatQuantity(i.quantity)} {formatUnit(i.unit, i.quantity)}{" "}
                        </strong>
                      )}
                      {formatIngredientName(i.name, i.quantity, i.unit)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-sans text-sm font-semibold">Steps ({recipe.steps.length})</h4>
                <ol className="grid gap-2 text-sm">
                  {recipe.steps.map((s, idx) => (
                    <li key={s.id} className="flex gap-2">
                      <span className="font-semibold text-primary tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
