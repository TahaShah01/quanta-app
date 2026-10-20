import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getLegal, getSettings } from "@/lib/site";

export function generateMetadata(): Metadata {
  return getLegal().privacy.meta;
}

export default function PrivacyPage() {
  return <LegalPage doc={getLegal().privacy} email={getSettings()?.email} />;
}
