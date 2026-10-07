import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/recipe";

/** A row of round photo links, the way recipe sites usually present meal types. */
export function CategoryGrid({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  return (
    <ul data-reveal suppressHydrationWarning data-reveal-grid className="grid grid-cols-4 gap-x-3 gap-y-7 sm:gap-x-6 lg:grid-cols-8">
      {categories.map((category, index) => (
        <li key={category.slug}>
          <Link href={`/recipes?category=${category.slug}`} className="group grid justify-items-center gap-3 text-center">
            <span className="relative aspect-square w-full max-w-32 rounded-full bg-card p-1 shadow-card ring-1 ring-border/70 transition duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-lift group-hover:ring-2 group-hover:ring-primary/50">
              <span className="relative block size-full overflow-hidden rounded-full bg-muted">
                <Image
                  src={category.image}
                  alt=""
                  fill
                  priority={index < 4}
                  sizes="(min-width: 1024px) 128px, 22vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold transition-colors group-hover:text-primary sm:text-[0.9375rem]">
                {category.name}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">{counts[category.slug] ?? 0} recipes</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
