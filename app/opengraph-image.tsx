import { getBrand, getSettings } from "@/lib/site";
import { OG_SIZE, OG_TYPE, ogCard } from "@/lib/og";

export const alt = "Open Graph preview";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image() {
  const settings = getSettings();
  return ogCard({
    kicker: getBrand(),
    title: settings?.seo?.title || settings?.tagline || getBrand(),
    description: settings?.seo?.description,
    footerLeft: settings?.location,
  });
}
