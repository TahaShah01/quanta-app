import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/home/SectionHeader";
import { CapabilityShowcase } from "@/components/home/CapabilityShowcase";
import type { SectionHeaderContent } from "@/lib/home-types";
import type { Service } from "@/lib/types";

export function Capabilities({
  content,
  services,
}: {
  content: SectionHeaderContent;
  services: Service[];
}) {
  return (
    // overflow-x-clip (not hidden) so panels can slide in from the right
    // without creating a horizontal scrollbar, and sticky still works.
    <div className="overflow-x-clip py-24 md:py-32">
      <Container>
        <CapabilityShowcase
          header={<SectionHeader content={content} />}
          services={services}
        />
      </Container>
    </div>
  );
}
