import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/home/SectionHeader";
import { TechStackBoard } from "@/components/home/TechStackBoard";
import type { SectionHeaderContent, TechStackContent } from "@/lib/home-types";

export function TechStack({
  content,
  tech,
}: {
  content: SectionHeaderContent;
  tech: TechStackContent;
}) {
  return (
    <div className="bg-[var(--surface)]/20 py-24 md:py-32">
      <Container>
        <SectionHeader content={content} className="mb-16 max-w-2xl" />
        <TechStackBoard categories={tech.categories} footnote={tech.footnote} />
      </Container>
    </div>
  );
}
