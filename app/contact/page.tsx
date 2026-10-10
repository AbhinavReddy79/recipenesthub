import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CreditCard, Mail, MessageCircle, Trophy } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import type { ContactTopic } from "@/lib/supabase/database.types";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about RecipeNest, Premium, payments, refunds or the weekly contest? Send us a message.",
  alternates: { canonical: "/contact" },
};

const TOPICS = new Set<ContactTopic>(["general", "billing", "refund", "contest", "account", "other"]);

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { topic } = await searchParams;
  const defaultTopic = typeof topic === "string" && TOPICS.has(topic as ContactTopic) ? (topic as ContactTopic) : "general";

  return (
    <ModuleTone tone="ocean">
      <PageHeader
        icon={<MessageCircle />}
        eyebrow="Support"
        title="Contact us"
        description="Questions about recipes, Premium, payments, refunds or the weekly contest? We're happy to help."
      />
      <div className="container-page grid gap-8 py-12 pb-24 lg:grid-cols-[1fr_320px] lg:gap-12">
        <ContactForm defaultTopic={defaultTopic} />

        <aside className="grid content-start gap-4">
          <InfoCard icon={<Clock />} title="Reply time">
            We reply by email within 2 working days (Monday to Saturday, India time).
          </InfoCard>
          {contactEmail && (
            <InfoCard icon={<Mail />} title="Email">
              <a href={`mailto:${contactEmail}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                {contactEmail}
              </a>
            </InfoCard>
          )}
          <InfoCard icon={<CreditCard />} title="Payments and refunds">
            Payments are processed securely by Razorpay. See our{" "}
            <Link href="/refund-policy" className="font-semibold text-primary underline-offset-4 hover:underline">
              Refund &amp; Cancellation Policy
            </Link>
            . Never share your card number, CVV, OTP or UPI PIN with anyone, including us.
          </InfoCard>
          <InfoCard icon={<Trophy />} title="Weekly contest">
            Questions about entries, votes or prizes? Choose “Weekly contest” as the topic.
          </InfoCard>
        </aside>
      </div>
    </ModuleTone>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft ring-1 ring-border/70">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-tone-soft text-tone [&_svg]:size-4.5">{icon}</span>
      <div className="grid gap-1 text-sm">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </section>
  );
}
