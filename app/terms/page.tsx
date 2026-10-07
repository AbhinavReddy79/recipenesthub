import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The ground rules for using RecipeNest.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      icon={<FileText />}
      eyebrow="Legal"
      title="Terms of Use"
      description="By using RecipeNest you agree to these terms. They're written to be read, not skimmed past."
      updated="October 7, 2026"
      sections={[
        {
          title: "Using RecipeNest",
          body: (
            <p>
              RecipeNest is a free site for discovering recipes, planning meals and making shopping lists. You can
              browse without a profile. Profiles are stored only in your browser (see the{" "}
              <Link href="/privacy">Privacy Policy</Link>), so you&apos;re responsible for keeping your device and password
              safe.
            </p>
          ),
        },
        {
          title: "Cooking safely",
          body: (
            <>
              <p>Recipes are provided for general information. Please use your own judgement in the kitchen:</p>
              <ul>
                <li>Check ingredients for allergies and dietary needs; diet labels are a guide, not a guarantee.</li>
                <li>Cook meat, fish and eggs to safe temperatures, and take care with hot oil, knives and appliances.</li>
                <li>Nutrition figures and cooking times are estimates and will vary with ingredients and equipment.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Prices and stores",
          body: (
            <p>
              Product prices are typical estimates for your region, not live prices, and nothing is charged on
              RecipeNest. Store buttons open the store&apos;s own website; RecipeNest isn&apos;t affiliated with those
              stores and isn&apos;t responsible for their products, prices or service.
            </p>
          ),
        },
        {
          title: "Recipes you publish",
          body: (
            <p>
              Recipes you write belong to you. Only publish recipes and photos that you created or have permission to
              use, and keep them respectful. Because profiles are stored in your browser, what you publish is
              currently visible on your device only.
            </p>
          ),
        },
        {
          title: "Photos and content",
          body: (
            <p>
              The RecipeNest recipe catalog, design and text belong to RecipeNest. Photos are used under their
              licences: Unsplash photos under the Unsplash License, ingredient photos from TheMealDB, and Wikimedia
              Commons photos under the Creative Commons licence credited under each one.
            </p>
          ),
        },
        {
          title: "No warranty",
          body: (
            <p>
              RecipeNest is provided as is, without warranties of any kind. To the extent the law allows, RecipeNest
              isn&apos;t liable for losses arising from use of the site, including lost data stored in your browser.
            </p>
          ),
        },
        {
          title: "Changes",
          body: <p>These terms may be updated as RecipeNest grows. Continuing to use the site means you accept the current version.</p>,
        },
      ]}
    />
  );
}
