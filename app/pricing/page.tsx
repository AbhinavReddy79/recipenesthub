import type { Metadata } from "next";
import { Crown } from "lucide-react";
import { PricingView } from "@/components/premium/pricing-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Premium",
  description: "RecipeNest Free and Premium. Premium can't be bought: win it in the weekly lucky draw.",
};

export default function PricingPage() {
  return (
    <ModuleTone tone="amber">
      <PageHeader
        icon={<Crown />}
        eyebrow="Premium"
        title="Win Premium"
        description="Premium isn't for sale. Join the weekly lucky draw for a chance to win 3 months of Premium and a cash prize."
      />
      <div className="container-page py-12 pb-24">
        <PricingView />
      </div>
    </ModuleTone>
  );
}
