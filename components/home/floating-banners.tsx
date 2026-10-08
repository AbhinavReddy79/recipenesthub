import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChefHat, Clock, ShoppingBasket, Sparkles } from "lucide-react";
import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";

interface FloatingBannersProps {
  indianCount: number;
  indianImage?: string;
  quickCount: number;
  quickImage?: string;
}

/** Three promo banners that gently float; every number comes from the real catalog. */
export function FloatingBanners({ indianCount, indianImage, quickCount, quickImage }: FloatingBannersProps) {
  return (
    <section aria-label="Highlights" className="container-page">
      <ul
        data-reveal
        suppressHydrationWarning
        data-reveal-grid
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pt-3 pb-6 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0"
      >
        <Banner delay="0s">
          <Link href="/cuisines/indian" className={cn(CARD, "bg-ink text-white")}>
            <Image
              src={indianImage || FALLBACK_RECIPE_IMAGE}
              alt=""
              fill
              sizes="(min-width: 768px) 33vw, 85vw"
              className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/55 to-black/10" />
            <Chip className="bg-white/12 text-gold-light ring-1 ring-white/20 backdrop-blur-md">
              <ChefHat aria-hidden /> Indian kitchen
            </Chip>
            <div className="mt-auto grid gap-1.5">
              <h3 className="font-display text-2xl leading-tight font-semibold text-balance">From biryani to dosa</h3>
              <p className="text-sm text-white/80">{indianCount} Indian recipes, tested in the RecipeNest kitchen.</p>
            </div>
            <Cta className="bg-metallic-gold text-[oklch(0.2_0.006_70)]">Explore Indian</Cta>
          </Link>
        </Banner>

        <Banner delay="-2s">
          <Link href="/meal-planner" className={cn(CARD, "bg-metallic-gold text-[oklch(0.2_0.006_70)]")}>
            <span aria-hidden className="absolute -top-10 -right-8 -z-10 size-40 rounded-full bg-white/25 blur-2xl animate-float-slow" />
            <span aria-hidden className="absolute -bottom-12 left-6 -z-10 size-32 rounded-full bg-white/20 blur-2xl animate-float-slow [animation-delay:-4s]" />
            <Chip className="bg-[oklch(0.2_0.006_70)] text-gold-light">
              <Sparkles aria-hidden /> Plan smarter
            </Chip>
            <div className="mt-auto grid gap-1.5">
              <h3 className="font-display text-2xl leading-tight font-semibold text-balance">Plan your week in minutes</h3>
              <p className="text-sm text-[oklch(0.2_0.006_70)]/75">Fill a 7-day planner and get one shopping list for all of it.</p>
            </div>
            <div aria-hidden className="absolute top-5 right-5 flex gap-2">
              <FloatIcon className="[animation-delay:-1s]"><CalendarDays /></FloatIcon>
              <FloatIcon className="mt-5 [animation-delay:-3s]"><ShoppingBasket /></FloatIcon>
            </div>
            <Cta className="bg-[oklch(0.2_0.006_70)] text-gold-light">Open the planner</Cta>
          </Link>
        </Banner>

        <Banner delay="-4s">
          <Link href="/recipes?category=quick-meals&sort=quickest" className={cn(CARD, "bg-metallic-charcoal text-white")}>
            <span
              aria-hidden
              className="absolute top-5 right-5 size-28 overflow-hidden rounded-full shadow-lift ring-4 ring-metallic/70 animate-float-slow sm:size-32"
            >
              <Image src={quickImage || FALLBACK_RECIPE_IMAGE} alt="" fill sizes="128px" className="object-cover" />
            </span>
            <Chip className="bg-metallic-silver text-[oklch(0.2_0.006_70)]">
              <Clock aria-hidden /> 30 minutes or less
            </Chip>
            <div className="mt-auto grid gap-1.5">
              <h3 className="font-display text-2xl leading-tight font-semibold text-balance">Good food, fast</h3>
              <p className="text-sm text-white/75">{quickCount} quick recipes for busy weeknights.</p>
            </div>
            <Cta className="bg-metallic-silver text-[oklch(0.2_0.006_70)]">Quick recipes</Cta>
          </Link>
        </Banner>
      </ul>
    </section>
  );
}

const CARD =
  "group relative isolate flex h-60 flex-col gap-4 overflow-hidden rounded-[1.75rem] p-6 shadow-lift ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-20px_oklch(0.2_0.005_70/0.45)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-64";

function Banner({ delay, children }: { delay: string; children: ReactNode }) {
  return (
    <li className="w-[85%] max-w-sm shrink-0 snap-start md:w-auto md:max-w-none">
      {/* Each banner floats on its own rhythm. */}
      <div className="animate-float" style={{ animationDelay: delay } as CSSProperties}>
        {children}
      </div>
    </li>
  );
}

function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold [&_svg]:size-3.5",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Cta({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-soft transition-transform duration-300 group-hover:translate-x-1",
        className,
      )}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden />
    </span>
  );
}

function FloatIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-2xl bg-white/45 text-[oklch(0.2_0.006_70)] shadow-soft ring-1 ring-white/60 backdrop-blur-md animate-float [&_svg]:size-5",
        className,
      )}
    >
      {children}
    </span>
  );
}
