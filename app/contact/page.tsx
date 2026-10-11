import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Clover, Mail, MessageCircle, Trophy } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import type { ContactTopic } from "@/lib/supabase/database.types";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about RecipeNest, Premium, the lucky draw or the weekly contest? Send us a message.",
  alternates: { canonical: "/contact" },
};

const TOPICS = new Set<ContactTopic>(["general", "billing", "contest", "account", "other"]);

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { topic } = await searchParams;
  const defaultTopic = typeof topic === "string" && TOPICS.has(topic as ContactTopic) ? (topic as ContactTopic) : "general";

  return (
    <ModuleTone tone="ocean">
      <PageHeader
        icon={<MessageCircle />}
        eyebrow="Support"
        title="Contact us"
        description="Questions about recipes, Premium, the lucky draw or the weekly contest? We're happy to help."
      />
      <div className="container-page grid gap-8 py-12 pb-24 lg:grid-cols-[1fr_320px] lg:gap-12">
        <ContactForm defaultTopic={defaultTopic} />

        <aside className="grid content-start gap-4">
          <InfoCard icon={<Clock />} title="Reply time">
            We reply within 2 working days (Monday to Saturday, India time). If you&apos;re signed in, our reply appears under Support messages in your account menu; otherwise we reply by email.
          </InfoCard>
          {contactEmail && (
            <InfoCard icon={<Mail />} title="Email">
              <a href={`mailto:${contactEmail}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                {contactEmail}
              </a>
            </InfoCard>
          )}
          <InfoCard icon={<Clover />} title="Premium and the lucky draw">
            Premium isn&apos;t sold: it&apos;s won in the weekly{" "}
            <Link href="/lucky-draw" className="font-semibold text-primary underline-offset-4 hover:underline">
              lucky draw
            </Link>
            . We never ask for payments, card numbers, OTPs or UPI PINs, so don&apos;t share them with anyone claiming to be us.
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
