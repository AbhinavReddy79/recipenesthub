import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What RecipeNest stores, where it lives, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      icon={<ShieldCheck />}
      eyebrow="Your data"
      title="Privacy Policy"
      description="Short version: your profile and everything you save stay in your own browser. We don't run tracking, ads or analytics."
      updated="October 7, 2026"
      sections={[
        {
          title: "What we store, and where",
          body: (
            <>
              <p>
                RecipeNest doesn&apos;t have a user database. When you create a profile, it is saved in your
                browser&apos;s local storage on the device you&apos;re using, and nowhere else. That includes:
              </p>
              <ul>
                <li>Your profile: name, username, email address, bio, location and optional photo.</li>
                <li>
                  Your password, which is salted and hashed before it is stored. It is never kept as plain text and
                  is never sent to us.
                </li>
                <li>Saved recipes, collections, meal plans, shopping lists, reviews, recipes you write, and your settings.</li>
              </ul>
              <p>
                Because this data lives on your device, it doesn&apos;t follow you to other phones or browsers, and
                other people can&apos;t see it.
              </p>
            </>
          ),
        },
        {
          title: "Deleting your data",
          body: (
            <p>
              Go to Settings → Account and choose <strong>Delete my profile</strong> to remove your profile and
              everything in it, or <strong>Clear all data in this browser</strong> to remove every RecipeNest profile
              on the device. Clearing your browser&apos;s site data does the same.
            </p>
          ),
        },
        {
          title: "Hosting",
          body: (
            <p>
              The site is hosted by Vercel. Like any web host, Vercel processes basic technical information about each
              request (such as IP address, browser type and the page requested) to deliver pages and keep the service
              secure. See{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                Vercel&apos;s privacy policy
              </a>{" "}
              for details.
            </p>
          ),
        },
        {
          title: "Cookies, tracking and ads",
          body: (
            <p>
              RecipeNest doesn&apos;t use advertising, analytics or tracking cookies, and doesn&apos;t sell or share
              personal information. Browser storage is used only to keep your profile, your saved items and
              preferences such as the colour theme.
            </p>
          ),
        },
        {
          title: "Photos and links to other sites",
          body: (
            <p>
              Recipe and product photos come from Unsplash, Wikimedia Commons and TheMealDB and are delivered through
              our host. The cart buttons next to ingredients open a store&apos;s own search page in a new tab; those
              stores have their own privacy policies, and RecipeNest isn&apos;t affiliated with them.
            </p>
          ),
        },
        {
          title: "Children",
          body: <p>RecipeNest isn&apos;t directed at children under 13, and we don&apos;t knowingly collect their information.</p>,
        },
        {
          title: "Changes to this policy",
          body: (
            <p>
              If the way RecipeNest handles data changes (for example, when online accounts are introduced), this
              page will be updated first and the date at the top will change.
            </p>
          ),
        },
      ]}
    />
  );
}
