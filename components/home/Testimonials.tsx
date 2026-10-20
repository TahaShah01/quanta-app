import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/home/SectionHeader";
import { TestimonialStage } from "@/components/home/TestimonialStage";
import type { HomeContent } from "@/lib/home-types";
import type { Testimonial } from "@/lib/types";

export function Testimonials({
  content,
  ui,
  testimonials,
}: {
  content: HomeContent["testimonials"];
  ui: HomeContent["ui"];
  testimonials: Testimonial[];
}) {
  return (
    <div className="relative overflow-hidden py-24 md:py-32">
      <Container>
        {/* Top-level Section Header with View All Reviews Action */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
              <Star size={12} className="fill-[var(--accent)]" />
              <span>{content.eyebrow || "Verified Client Feedback"}</span>
            </div>
            <h2 className="text-3xl font-light tracking-tight text-[var(--foreground)] md:text-5xl">
              Endorsements from leaders <br className="hidden sm:inline" />
              <span className="italic font-normal text-[var(--accent)]">we&apos;ve built with.</span>
            </h2>
          </div>

          <div className="shrink-0">
            <Link
              href="/reviews"
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <span>View All Reviews</span>
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>

        {testimonials.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <h3 className="text-lg font-medium text-[var(--foreground)]">Verified Reviews in Moderation</h3>
            <p className="mt-2 text-sm text-[var(--secondary)] max-w-md mx-auto">
              Our verified client project reviews are currently undergoing annual verification. In the meantime, explore our shipped production projects or initiate an inquiry.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/projects"
                className="rounded-full bg-[var(--accent)] px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--accent-foreground)] hover:brightness-110"
              >
                Explore Projects
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-[var(--border)] px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                Contact Studio
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <SectionHeader content={content} />
            </div>
            <div className="lg:col-span-8">
              <TestimonialStage
                testimonials={testimonials}
                labels={{
                  previous: ui.previous,
                  next: ui.next,
                  list: ui.testimonialsLabel,
                }}
              />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
