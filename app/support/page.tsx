import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, MessageCircle, PenLine } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { SupportMessages } from "@/components/contact/support-messages";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Support messages",
  description: "Your messages to RecipeNest and our replies.",
  robots: { index: false },
};

export default function SupportPage() {
  return (
    <ModuleTone tone="ocean">
      <PageHeader
        icon={<LifeBuoy />}
        eyebrow="Support"
        title="Support messages"
        description="Messages you sent us while signed in, with our replies. You can answer back here."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">
              <PenLine data-icon="inline-start" />
              New message
            </Link>
          </Button>
        }
      />
      <div className="container-page py-12 pb-24">
        <RequireProfile
          icon={<MessageCircle />}
          title="Sign in to see your messages"
          description="When you contact us while signed in, our replies show up here."
        >
          <SupportMessages />
        </RequireProfile>
      </div>
    </ModuleTone>
  );
}
