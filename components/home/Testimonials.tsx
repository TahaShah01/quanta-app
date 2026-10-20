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
  if (testimonials.length === 0) return null;

  return (
    <div className="relative overflow-hidden py-24 md:py-32">
      <Container>
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
      </Container>
    </div>
  );
}
