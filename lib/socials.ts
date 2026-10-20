import type { ComponentType } from "react";
import {
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterXIcon,
} from "@/components/ui/SocialIcons";
import type { SocialLinks } from "@/lib/types";

export interface SocialLink {
  key: keyof SocialLinks;
  label: string;
  href: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

const DEFINITIONS: Array<Omit<SocialLink, "href">> = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "twitter", label: "X", Icon: TwitterXIcon },
  { key: "github", label: "GitHub", Icon: GithubIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinIcon },
];

/** Only valid http/https profiles that are actually configured are returned. */
export function getSocialLinks(socials?: SocialLinks | null): SocialLink[] {
  if (!socials) return [];
  return DEFINITIONS.flatMap((def) => {
    const raw = socials[def.key];
    if (!raw || typeof raw !== "string") return [];
    const href = raw.trim();
    if (!href) return [];
    // Only accept http/https protocols to prevent dangerous schemes (e.g. javascript:)
    if (!/^https?:\/\//i.test(href)) return [];
    return [{ ...def, href }];
  });
}

