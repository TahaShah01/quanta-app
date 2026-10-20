import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/home/SectionHeader";
import type { SectionHeaderContent } from "@/lib/home-types";

interface PageSectionProps {
  id?: string;
  header?: Omit<SectionHeaderContent, "navLabel">;
  /** Draw the divider above the section (default true) */
  bordered?: boolean;
  className?: string;
  children: ReactNode;
}

/** Standard content band: same rhythm and header as the homepage sections. */
export function PageSection({
  id,
  header,
  bordered = true,
  className = "",
  children,
}: PageSectionProps) {
  return (
    <section
      id={id}
      className={`relative w-full py-20 md:py-28 ${
        bordered ? "border-t border-[var(--border)]" : ""
      } ${className}`}
    >
      <Container>
        {header && <SectionHeader content={header} className="mb-14 md:mb-20" />}
        {children}
      </Container>
    </section>
  );
}
