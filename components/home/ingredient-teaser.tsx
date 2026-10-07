import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Carrot } from "lucide-react";
import { Eyebrow } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { unsplash } from "@/lib/images";

const STARTERS = [
  { label: "Chicken and rice", have: "chicken,rice,onion,garlic" },
  { label: "Eggs and bread", have: "egg,bread,avocado" },
  { label: "Pasta night", have: "pasta,garlic,tomato,parmesan" },
  { label: "Chickpeas and lemon", have: "chickpeas,lemon,garlic" },
];

export function IngredientTeaser() {
  return (
    <section data-tone="herb" aria-labelledby="ingredient-teaser" className="container-page">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-herb-soft ring-1 ring-herb/15">
        <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-60" />
        <div className="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-2 md:gap-12 lg:p-14">
          <div className="grid gap-5">
            <Eyebrow>Fridge to table</Eyebrow>
            <h2 id="ingredient-teaser" className="text-balance text-[2rem] leading-tight font-semibold sm:text-[2.5rem]">
              Cook with what you have
            </h2>
            <p className="max-w-lg text-pretty text-lg text-muted-foreground">
              Tell us what&apos;s in your fridge and we&apos;ll show the recipes you can make right now, and what
              you&apos;re missing for the rest.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((starter) => (
                <Link
                  key={starter.label}
                  href={`/ingredients?have=${starter.have}`}
                  className="rounded-full border border-herb/25 bg-card px-3.5 py-1.5 text-sm font-medium shadow-xs transition-colors hover:border-herb hover:text-herb"
                >
                  {starter.label}
                </Link>
              ))}
            </div>
            <div className="pt-2">
              <Button asChild size="lg" className="bg-herb text-herb-foreground shadow-none hover:bg-herb/90">
                <Link href="/ingredients">
                  <Carrot data-icon="inline-start" />
                  Find recipes by ingredient
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative md:order-last">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-lift transition-transform duration-500 hover:rotate-0 md:rotate-[1.5deg] md:animate-float-slow">
              <Image
                src={unsplash("1466637574441-749b8f19452f", 1000)}
                alt="Fresh ingredients on a cutting board"
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
