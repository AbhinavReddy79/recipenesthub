import type { ReactNode } from "react";
import { contactEmail } from "@/lib/site";
import { slugify } from "@/lib/utils";
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
  /** Shown as "Effective" and "Last updated". */
  updated: string;
  /** Optional plain-language highlights shown before the full text. */
  keyPoints?: string[];
  sections: LegalSection[];
}

/** Shared layout for the privacy policy and terms of use: summary, contents, numbered sections. */
export function LegalPage({ eyebrow, title, description, icon, updated, keyPoints, sections }: LegalPageProps) {
  const numbered = sections.map((section, i) => ({ ...section, id: slugify(section.title), number: i + 1 }));

  return (
    <ModuleTone tone="ocean">
      <PageHeader icon={icon} eyebrow={eyebrow} title={title} description={description} />
      <div className="container-page grid gap-8 py-12 pb-24 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-bold tracking-[0.16em] text-tone uppercase">Contents</p>
          <ol className="grid gap-0.5 rounded-2xl bg-card p-3 text-sm shadow-card ring-1 ring-border/70">
            {numbered.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex gap-2.5 rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:bg-tone-soft hover:text-tone"
                >
                  <span className="w-5 shrink-0 font-semibold tabular-nums">{section.number}.</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="grid min-w-0 gap-10 rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/70 sm:p-10">
          <dl className="flex flex-wrap gap-x-8 gap-y-2 border-b pb-6 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Effective date</dt>
              <dd className="font-semibold">{updated}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-semibold">{updated}</dd>
            </div>
          </dl>

          {keyPoints && keyPoints.length > 0 && (
            <section aria-labelledby="key-points" className="grid gap-3 rounded-2xl bg-tone-soft p-5 sm:p-6">
              <h2 id="key-points" className="text-xl font-semibold">
                Key points
              </h2>
              <ul className="grid gap-2 text-[0.9375rem] text-foreground/85">
                {keyPoints.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-tone" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {numbered.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="grid scroll-mt-24 gap-3">
              <h2 id={`${section.id}-title`} className="text-2xl font-semibold">
                {section.number}. {section.title}
              </h2>
              <div className="grid gap-3 text-pretty leading-relaxed text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h3]:mt-2 [&_h3]:font-sans [&_h3]:text-base [&_h3]:font-semibold [&_h3]:tracking-normal [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">
                {section.body}
              </div>
            </section>
          ))}

          <p className="border-t pt-6 text-sm text-muted-foreground">
            {contactEmail ? (
              <>
                Questions about this document? Contact us at{" "}
                <a href={`mailto:${contactEmail}`} className="font-medium text-primary underline-offset-4 hover:underline">
                  {contactEmail}
                </a>
                .
              </>
            ) : (
              "Questions about this document can be sent to the RecipeNest team using the contact details published on this website."
            )}
          </p>
        </article>
      </div>
    </ModuleTone>
  );
}
