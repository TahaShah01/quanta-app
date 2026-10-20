import type { ComponentType } from "react";
import { getSocialIcon } from "@/components/ui/SocialIcons";
import type { ManagedSocialLink, SocialLinks } from "@/lib/types";

export interface SocialLink {
  key: string;
  label: string;
  ariaLabel?: string;
  href: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

export const DEFAULT_SOCIAL_LINKS: ManagedSocialLink[] = [
  {
    id: "social-twitter",
    platform: "twitter",
    label: "X",
    ariaLabel: "Follow Quanta on X",
    url: "",
    icon: "twitter",
    enabled: true,
    order: 1,
  },
  {
    id: "social-instagram",
    platform: "instagram",
    label: "Instagram",
    ariaLabel: "Follow Quanta on Instagram",
    url: "",
    icon: "instagram",
    enabled: true,
    order: 2,
  },
  {
    id: "social-facebook",
    platform: "facebook",
    label: "Facebook",
    ariaLabel: "Follow Quanta on Facebook",
    url: "",
    icon: "facebook",
    enabled: true,
    order: 3,
  },
  {
    id: "social-linkedin",
    platform: "linkedin",
    label: "LinkedIn",
    ariaLabel: "Connect with Quanta on LinkedIn",
    url: "",
    icon: "linkedin",
    enabled: true,
    order: 4,
  },
  {
    id: "social-github",
    platform: "github",
    label: "GitHub",
    ariaLabel: "Explore Quanta code repositories on GitHub",
    url: "",
    icon: "github",
    enabled: true,
    order: 5,
  },
];

/** Check if a URL uses a safe, permitted HTTP/HTTPS scheme */
export function isValidSocialUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return /^https?:\/\//i.test(trimmed);
}

const LEGACY_KEYS: Array<{ key: keyof SocialLinks; label: string; icon: string }> = [
  { key: "instagram", label: "Instagram", icon: "instagram" },
  { key: "facebook", label: "Facebook", icon: "facebook" },
  { key: "twitter", label: "X", icon: "twitter" },
  { key: "github", label: "GitHub", icon: "github" },
  { key: "linkedin", label: "LinkedIn", icon: "linkedin" },
];

/**
 * Returns strictly valid, configured, enabled social links for public rendering.
 * Unconfigured, disabled, or malformed URLs are omitted completely.
 */
export function getSocialLinks(
  input?: SocialLinks | ManagedSocialLink[] | null,
  dynamicLinks?: ManagedSocialLink[] | null
): SocialLink[] {
  // If dynamic managed links are provided, they take full precedence
  const managed = Array.isArray(input) ? input : dynamicLinks;
  if (Array.isArray(managed) && managed.length > 0) {
    return managed
      .filter((item) => item.enabled !== false && isValidSocialUrl(item.url))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item) => ({
        key: item.id || item.platform,
        label: item.label || item.platform,
        ariaLabel: item.ariaLabel || `Visit Quanta on ${item.label || item.platform}`,
        href: item.url.trim(),
        Icon: getSocialIcon(item.icon || item.platform),
      }));
  }

  // Fallback to legacy dictionary if only socials object provided
  const socials = input && !Array.isArray(input) ? input : null;
  if (!socials) return [];

  return LEGACY_KEYS.flatMap((def) => {
    const raw = socials[def.key];
    if (!raw || typeof raw !== "string") return [];
    const href = raw.trim();
    if (!isValidSocialUrl(href)) return [];
    return [
      {
        key: def.key,
        label: def.label,
        ariaLabel: `Visit Quanta on ${def.label}`,
        href,
        Icon: getSocialIcon(def.icon),
      },
    ];
  });
}
