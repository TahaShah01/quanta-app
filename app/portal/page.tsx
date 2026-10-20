import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PortalClient } from "@/components/portal/PortalClient";
import { getFeatures, getPages } from "@/lib/site";

export function generateMetadata(): Metadata {
  const { meta } = getPages().portal;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false },
  };
}

export default function ClientPortalPage() {
  const copy = getPages().portal;
  const enabled = getFeatures().portal;

  return (
    <>
      <PageHero
        eyebrow={copy.hero.eyebrow}
        shape="lattice"
        lines={copy.hero.lines}
        body={copy.hero.body}
      />
      <PortalClient copy={copy} enabled={enabled} />
    </>
  );
}
