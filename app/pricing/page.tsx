import type { Metadata } from "next";
import { Crown } from "lucide-react";
import { PricingView } from "@/components/premium/pricing-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Premium",
  description: "RecipeNest Free and Premium plans: unlimited recipes and the weekly cooking contest for ₹79 a month or ₹899 a year.",
};

export default function PricingPage() {
  return (
    <ModuleTone tone="amber">
      <PageHeader
        icon={<Crown />}
        eyebrow="Plans"
        title="Go Premium"
        description="Publish as many recipes as you like and compete in the weekly cooking contest for cash prizes."
      />
      <div className="container-page py-12 pb-24">
        <PricingView />
      </div>
    </ModuleTone>
  );
}
