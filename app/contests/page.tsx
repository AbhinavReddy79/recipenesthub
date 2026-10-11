import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Trophy } from "lucide-react";
import { ContestEligibility } from "@/components/contests/contest-eligibility";
import { ContestView } from "@/components/contests/contest-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Weekly Contest",
  description: "Every week a new theme: Premium cooks enter their best recipe, members vote, and the winner takes home a cash prize.",
};

export default function ContestsPage() {
  return (
    <ModuleTone tone="amber">
      <PageHeader
        icon={<Trophy />}
        eyebrow="Weekly contest"
        title="Cook. Share. Win."
        description="A new theme every week. Premium members enter their best recipe, everyone votes, and the top recipe wins a cash prize plus a free month of Premium."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">
              <Crown data-icon="inline-start" />
              Premium
            </Link>
          </Button>
        }
      />
      <div className="container-page grid gap-14 py-12 pb-24">
        <ContestView />
        <ContestEligibility />
      </div>
    </ModuleTone>
  );
}
