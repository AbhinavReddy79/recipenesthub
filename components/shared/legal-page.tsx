import type { ReactNode } from "react";
import { contactEmail } from "@/lib/site";
import { ModuleTone } from "./module-tone";
import { PageHeader } from "./page-header";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  updated: string;
  sections: LegalSection[];
}

/** Shared layout for the privacy policy and terms of use. */
export function LegalPage({ eyebrow, title, description, icon, updated, sections }: LegalPageProps) {
  return (
    <ModuleTone tone="ocean">
      <PageHeader icon={icon} eyebrow={eyebrow} title={title} description={description} />
      <div className="container-page py-12 pb-24">
        <article className="mx-auto grid max-w-3xl gap-10 rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/70 sm:p-10">
          <p className="text-sm text-muted-foreground">Last updated {updated}</p>
          {sections.map((section, i) => (
            <section key={section.title} className="grid gap-3">
              <h2 className="flex items-baseline gap-3 text-2xl font-semibold">
                <span className="font-sans text-sm font-bold text-tone tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              <div className="grid gap-3 text-pretty leading-relaxed text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">
                {section.body}
              </div>
            </section>
          ))}
          <section className="grid gap-3 rounded-2xl bg-tone-soft p-5">
            <h2 className="text-xl font-semibold">Questions</h2>
            <p className="text-foreground/85">
              {contactEmail ? (
                <>
                  Email{" "}
                  <a href={`mailto:${contactEmail}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {contactEmail}
                  </a>{" "}
                  and we&apos;ll get back to you.
                </>
              ) : (
                "If anything here is unclear, reach out to the RecipeNest team and we'll be happy to explain."
              )}
            </p>
          </section>
        </article>
      </div>
    </ModuleTone>
  );
}
