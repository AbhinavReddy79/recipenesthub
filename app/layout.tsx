import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Navbar } from "@/components/layout/navbar";
import type { SearchIndexItem } from "@/components/layout/search-command";
import { Providers } from "@/components/providers";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { formatMinutes } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import { listRecipes } from "@/lib/services/recipes";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["recipes", "meal planner", "cooking", "shopping list", "food", "cuisines"],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "/",
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "A table spread with colourful dishes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

export const viewport: Viewport = {
  // The site opens in the light theme by default, so the browser bar matches it.
  themeColor: "#fbfaf7",
};

async function buildSearchIndex(): Promise<SearchIndexItem[]> {
  const recipes = await listRecipes();
  return recipes.map((r) => ({
    slug: r.slug,
    title: r.title,
    image: r.image,
    meta: `${CUISINE_LABELS[r.cuisine]} · ${formatMinutes(totalMinutes(r))} · ${r.difficulty}`,
    keywords: [r.cuisine, r.mealType, ...r.diets, ...(r.tags ?? [])].join(" "),
  }));
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const searchIndex = await buildSearchIndex();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <Providers>
          <ScrollReveal />
          <ScrollToTop />
          <a
            href="#main"
            className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <Navbar searchIndex={searchIndex} />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <Footer />
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}
