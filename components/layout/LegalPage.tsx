import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { PageHero } from "@/components/layout/PageHero";
import type { LegalDocument } from "@/lib/pages-types";

/** Renders a privacy/terms document from content/legal.json. */
export function LegalPage({ doc, email }: { doc: LegalDocument; email?: string }) {
  return (
    <>
      <PageHero
        eyebrow={doc.eyebrow}
        shape="drift"
        lines={[{ text: doc.title }]}
        body={doc.updated}
      />

      <section className="w-full py-16 md:py-24">
        <Container>
          <div className="flex max-w-3xl flex-col gap-12">
            {doc.sections.map((section) => (
              <FadeIn key={section.heading} delay={0.1} yOffset={15} scroll>
                <div className="flex flex-col gap-4">
                  <h2 className="text-subsection">{section.heading}</h2>
                  <p className="text-body text-sm leading-relaxed">
                    {email && section.body.includes(email)
                      ? section.body.split(email).flatMap((part, i, all) =>
                          i < all.length - 1
                            ? [
                                part,
                                <a
                                  key={i}
                                  href={`mailto:${email}`}
                                  className="text-[var(--foreground)] underline hover:no-underline"
                                >
                                  {email}
                                </a>,
                              ]
                            : [part]
                        )
                      : section.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
