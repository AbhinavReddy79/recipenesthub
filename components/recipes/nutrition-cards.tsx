import type { Nutrition } from "@/types/recipe";

/** A plain nutrition table, like the panel on a food label. */
export function NutritionCards({ nutrition }: { nutrition: Nutrition }) {
  const rows = [
    { label: "Calories", value: `${nutrition.calories} kcal` },
    { label: "Protein", value: `${nutrition.protein} g` },
    { label: "Carbohydrates", value: `${nutrition.carbs} g` },
    { label: "Fat", value: `${nutrition.fat} g` },
    ...(nutrition.fiber !== undefined ? [{ label: "Fibre", value: `${nutrition.fiber} g` }] : []),
    ...(nutrition.sugar !== undefined ? [{ label: "Sugar", value: `${nutrition.sugar} g` }] : []),
  ];
  return (
    <section aria-labelledby="nutrition-heading">
      <div className="flex items-baseline justify-between border-b pb-3">
        <h2 id="nutrition-heading" className="text-[1.75rem] font-semibold">
          Nutrition
        </h2>
        <span className="text-xs text-muted-foreground">Per serving, estimated</span>
      </div>
      <dl className="text-[0.9375rem]">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between border-b border-dashed py-2 last:border-b-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
