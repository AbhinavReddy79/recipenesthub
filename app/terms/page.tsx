import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { LegalPage } from "@/components/shared/legal-page";
import { DRAW_PREMIUM_MONTHS, FREE_RECIPES_PER_MONTH } from "@/lib/plans";

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
      updated="October 11, 2026"
      sections={[
        {
          title: "Using RecipeNest",
          body: (
            <p>
              RecipeNest is a members&apos; site for discovering recipes, planning meals and making shopping lists.
              Creating an account is free. Keep your password private and your details accurate; you&apos;re
              responsible for activity on your account. How we handle your data is explained in the{" "}
              <Link href="/privacy">Privacy Policy</Link>.
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
              Product prices shown with recipes are typical estimates for your region, not live prices, and you
              can&apos;t buy groceries on RecipeNest. Store buttons open the store&apos;s own website; RecipeNest isn&apos;t affiliated with those
              stores and isn&apos;t responsible for their products, prices or service.
            </p>
          ),
        },
        {
          title: "Free and Premium plans",
          body: (
            <>
              <p>
                The Free plan costs nothing and lets you publish up to {FREE_RECIPES_PER_MONTH} recipes a month.
                Premium adds unlimited recipes and entry to the weekly contest. See the <Link href="/pricing">Premium</Link> page.
              </p>
              <ul>
                <li>Premium can&apos;t be bought. It is only given as a prize in the weekly lucky draw or the weekly contest.</li>
                <li>RecipeNest never takes payments and will never ask you for card numbers, OTPs or UPI PINs.</li>
                <li>Premium won as a prize ends automatically at the end of its period. It has no cash value and can&apos;t be transferred.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Weekly lucky draw",
          body: (
            <>
              <p>Each week RecipeNest may run a free lucky draw, with the dates, number of winners and prize shown on the lucky draw page.</p>
              <ul>
                <li>Any member can join, once per draw, for free. No purchase or payment is needed to enter or to win.</li>
                <li>
                  When the draw closes, winners are picked at random from everyone who joined. Each winner gets {DRAW_PREMIUM_MONTHS} months of
                  Premium straight away, plus any cash prize shown for that draw.
                </li>
                <li>
                  One account per person. We may disqualify entries from fake or duplicate accounts. Cash prizes are paid to the winner after we
                  contact them by email and may be subject to tax. RecipeNest&apos;s decision is final.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Weekly contest",
          body: (
            <>
              <p>Each week RecipeNest may run a cooking contest with a theme and prize announced on the contest page.</p>
              <ul>
                <li>Only Premium members can enter, with one of their own published recipes that fits the theme. There is no separate entry fee.</li>
                <li>All members can vote, once per entry. The entry with the most votes when voting closes wins; ties go to the earlier entry.</li>
                <li>
                  Entries must be your own work. We may remove entries or votes that break these terms, are off-theme, or
                  involve fake accounts or vote trading, and may disqualify those involved.
                </li>
                <li>
                  Cash prizes are paid to the winner after we contact them by email and may be subject to tax. RecipeNest&apos;s decision on
                  results is final.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Recipes you publish",
          body: (
            <p>
              Recipes you write belong to you. Only publish recipes and photos that you created or have permission to
              use, and keep them respectful. Published recipes and reviews are visible to everyone, and RecipeNest
              may remove content or suspend accounts that break these terms.
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
              isn&apos;t liable for losses arising from use of the site, including loss of data.
            </p>
          ),
        },
        {
          title: "Changes",
          body: <p>These terms may be updated as RecipeNest grows. Continuing to use the site means you accept the current version.</p>,
        },
        {
          title: "Governing law and contact",
          body: (
            <p>
              These terms are governed by the laws of India. Questions? <Link href="/contact">Contact us</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
