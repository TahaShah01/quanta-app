import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getLegal, getSettings } from "@/lib/site";

export function generateMetadata(): Metadata {
  return getLegal().terms.meta;
}

export default function TermsPage() {
  return <LegalPage doc={getLegal().terms} email={getSettings()?.email} />;
}
