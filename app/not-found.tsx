import Link from "next/link";
import { Compass, Cookie, Croissant, Pizza, Salad, Soup } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Food icons drifting around the 404. */
const FLOATERS = [
  { icon: Pizza, tone: "coral", className: "top-[8%] left-[10%] rotate-[-12deg]", delay: "0ms" },
  { icon: Soup, tone: "herb", className: "top-[18%] right-[12%] rotate-6", delay: "700ms" },
  { icon: Croissant, tone: "amber", className: "bottom-[22%] left-[6%] rotate-12", delay: "1400ms" },
  { icon: Cookie, tone: "berry", className: "bottom-[12%] right-[8%] -rotate-6", delay: "300ms" },
  { icon: Salad, tone: "ocean", className: "top-[48%] left-[2%] hidden rotate-3 sm:flex", delay: "1000ms" },
] as const;

export default function NotFound() {
  return (
    <div className="relative isolate flex flex-1 overflow-hidden bg-warm-glow">
      <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-70 [mask-image:radial-gradient(closest-side,black,transparent)]" />
      {FLOATERS.map(({ icon: Icon, tone, className, delay }) => (
        <span
          key={tone}
          aria-hidden
          data-tone={tone}
          className={`absolute flex size-14 items-center justify-center rounded-2xl bg-tone text-tone-foreground shadow-lift sm:size-16 ${className}`}
        >
          <span className="animate-float" style={{ animationDelay: delay }}>
            <Icon className="size-7" />
          </span>
        </span>
      ))}

      <div className="container-page grid flex-1 place-items-center py-24">
        <div className="grid max-w-lg justify-items-center gap-6 text-center">
          <p className="bg-gradient-to-br from-primary via-saffron to-coral bg-clip-text font-display text-[7rem] leading-none font-semibold text-transparent animate-pop sm:text-[10rem]">
            404
          </p>
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold sm:text-4xl">This page has left the kitchen</h1>
            <p className="text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to something tasty.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/recipes">
                <Compass data-icon="inline-start" />
                Discover recipes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
