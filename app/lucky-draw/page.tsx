import type { Metadata } from "next";
import Link from "next/link";
import { Clover, Crown } from "lucide-react";
import { LuckyDrawView } from "@/components/draws/lucky-draw-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Lucky Draw",
  description: "Join the weekly RecipeNest lucky draw for a chance to win 3 months of Premium, plus a cash prize in some weeks.",
};

export default function LuckyDrawPage() {
  return (
    <ModuleTone tone="amber">
      <PageHeader
        icon={<Clover />}
        eyebrow="Weekly lucky draw"
        title="Join. Wait. Win."
        description="Every week, members join the draw for free. Winners are picked at random and get 3 months of Premium, plus a cash prize in some weeks."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">
              <Crown data-icon="inline-start" />
              What Premium gives you
            </Link>
          </Button>
        }
      />
      <div className="container-page py-12 pb-24">
        <LuckyDrawView />
      </div>
    </ModuleTone>
  );
}
