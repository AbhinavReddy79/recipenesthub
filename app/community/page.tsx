import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, PenLine, Plus, Share2, Users } from "lucide-react";
import { CommunityRecipes } from "@/components/community/community-recipes";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Community",
  description: "Recipes shared by RecipeNest cooks. Publish your own and it will appear here.",
  alternates: { canonical: "/community" },
};

const STEPS = [
  { title: "Write it down", text: "Add ingredients, steps, timings and a photo in six quick steps.", icon: PenLine, tone: "coral" },
  { title: "Preview and publish", text: "Check how it looks, then publish — or keep it as a draft.", icon: Eye, tone: "herb" },
  { title: "Share it", text: "Your recipe appears here and in Search, credited to you.", icon: Share2, tone: "berry" },
] as const;

export default function CommunityPage() {
  return (
    <ModuleTone tone="amber">
      <PageHeader
        icon={<Users />}
        eyebrow="Community"
        title="Recipes from RecipeNest cooks"
        description="Everything here was written and published by people using RecipeNest. Add yours to the collection."
        actions={
          <Button asChild size="lg">
            <Link href="/recipes/create">
              <Plus data-icon="inline-start" />
              Share a recipe
            </Link>
          </Button>
        }
      />

      <div className="container-page grid gap-20 py-14 pb-24">
        <section aria-labelledby="community-recipes">
          <h2 id="community-recipes" className="sr-only">
            Community recipes
          </h2>
          <CommunityRecipes />
        </section>

        <section data-reveal suppressHydrationWarning aria-labelledby="how-sharing-works">
          <SectionHeading id="how-sharing-works" eyebrow="Three steps" title="How sharing works" />
          <ol data-reveal-grid className="grid gap-5 md:grid-cols-3">
            {STEPS.map(({ title, text, icon: Icon, tone }, i) => (
              <li
                key={title}
                data-tone={tone}
                className="group relative grid content-start gap-3 overflow-hidden rounded-3xl border bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span
                  aria-hidden
                  className="absolute -top-6 -right-2 font-display text-[7rem] leading-none font-semibold text-tone/10 transition-transform duration-500 group-hover:scale-110"
                >
                  {i + 1}
                </span>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-tone text-tone-foreground shadow-soft transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-2 font-sans text-lg font-bold tracking-normal">
                  <span className="text-tone">{i + 1}.</span> {title}
                </h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>

          <div className="dark band-charcoal relative isolate mt-10 flex flex-wrap items-center gap-6 overflow-hidden rounded-3xl bg-ink p-6 text-foreground sm:p-8">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(50%_120%_at_100%_0%,color-mix(in_oklch,var(--saffron)_18%,transparent),transparent)]"
            />
            <div className="grid flex-1 gap-1.5">
              <p className="font-display text-2xl font-semibold">Looking for something to cook today?</p>
              <p className="text-muted-foreground">The RecipeNest kitchen has a full catalog of tested recipes ready to explore.</p>
            </div>
            <Button asChild size="lg">
              <Link href="/recipes">
                Browse the catalog
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </ModuleTone>
  );
}
