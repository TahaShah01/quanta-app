import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { SiteSettings, ManagedSocialLink } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";
import { isValidSocialUrl } from "@/lib/socials";

export async function GET() {
  const settings = readJSON<SiteSettings>("settings.json");
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as Partial<SiteSettings>;
    const current = readJSON<SiteSettings>("settings.json");

    // Validate and sanitize socialLinks if provided
    let cleanSocialLinks: ManagedSocialLink[] | undefined = undefined;
    if (Array.isArray(body.socialLinks)) {
      cleanSocialLinks = body.socialLinks.map((link, idx) => {
        const rawUrl = typeof link.url === "string" ? link.url.trim() : "";
        // Clean URL: only accept valid http/https or leave empty
        const safeUrl = isValidSocialUrl(rawUrl) ? rawUrl : "";
        return {
          id: String(link.id || `social-${idx}`).slice(0, 50),
          platform: String(link.platform || "generic").slice(0, 30).toLowerCase(),
          label: String(link.label || link.platform || "Social").slice(0, 50),
          ariaLabel: typeof link.ariaLabel === "string" ? link.ariaLabel.slice(0, 100) : undefined,
          url: safeUrl,
          icon: String(link.icon || link.platform || "globe").slice(0, 30).toLowerCase(),
          enabled: link.enabled !== false,
          order: typeof link.order === "number" ? link.order : idx + 1,
        };
      });
    }

    const updated: SiteSettings = {
      ...current,
      ...body,
      companyName: body.companyName !== undefined ? String(body.companyName).slice(0, 80) : current.companyName,
      tagline: body.tagline !== undefined ? String(body.tagline).slice(0, 300) : current.tagline,
      email: body.email !== undefined ? String(body.email).slice(0, 100) : current.email,
      location: body.location !== undefined ? String(body.location).slice(0, 100) : current.location,
      phone: body.phone !== undefined ? String(body.phone).slice(0, 50) : current.phone,
      timezone: body.timezone !== undefined ? String(body.timezone).slice(0, 50) : current.timezone,
      socialLinks: cleanSocialLinks !== undefined ? cleanSocialLinks : current.socialLinks,
    };

    writeJSON("settings.json", updated);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 400 });
  }
}
