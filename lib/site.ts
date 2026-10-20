import { readJSON, listBlogPosts } from "@/lib/content";
import { listFeaturedReviews, listApprovedReviews } from "@/lib/reviews";
import {
  buildTokens,
  countTools,
  getHomeContent,
  getTechStack,
  readFilled,
  type TokenMap,
} from "@/lib/home";
import type {
  BlogPost,
  ClientLogo,
  FeatureFlags,
  Partner,
  Project,
  Service,
  SiteSettings,
  TeamMember,
  Testimonial,
} from "@/lib/types";
import { visibleLinks } from "@/lib/features";
import type {
  LegalContent,
  NavigationContent,
  PagesContent,
} from "@/lib/pages-types";

function readList<T>(file: string): T[] {
  try {
    return readJSON<T[]>(file);
  } catch {
    return [];
  }
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export function getServices(): Service[] {
  return readList<Service>("services.json")
    .filter((s) => s.published)
    .sort(byOrder);
}

export function getProjects(): Project[] {
  return readList<Project>("projects.json")
    .filter((p) => p.published)
    .sort(byOrder);
}

export function getTestimonials(): Testimonial[] {
  try {
    // Dynamic review system: featured approved reviews take precedence
    const featured = listFeaturedReviews();
    const reviews = featured.length > 0 ? featured : listApprovedReviews();
    if (reviews.length > 0) {
      return reviews.map((r: { id: string; reviewerName: string; reviewerRole?: string; reviewerCompany?: string; body: string; rating: number; order?: number }, idx: number) => ({
        id: r.id,
        clientName: r.reviewerName,
        clientRole: r.reviewerRole || "",
        clientCompany: r.reviewerCompany || "",
        quote: r.body,
        avatar: "",
        rating: r.rating || 5,
        published: true,
        order: r.order ?? idx + 1,
      }));
    }
  } catch {
    // Fallback if reviews module not ready
  }
  return readList<Testimonial>("testimonials.json")
    .filter((t) => t.published)
    .sort(byOrder);
}

export function getTeam(): TeamMember[] {
  return readList<TeamMember>("team.json").sort(byOrder);
}

export function getPosts(): BlogPost[] {
  try {
    return (listBlogPosts() as BlogPost[])
      .filter((p) => p.published)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  } catch {
    return [];
  }
}

export function getSettings(): SiteSettings | null {
  try {
    return readJSON<SiteSettings>("settings.json");
  } catch {
    return null;
  }
}

/** Public base URL, from Admin → Settings → Search & sharing. */
export function getSiteUrl(): string {
  const url = getSettings()?.seo?.siteUrl?.trim() || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export function getBrand(): string {
  return getSettings()?.companyName?.trim() || "Quanta";
}

const DEFAULT_FEATURES: FeatureFlags = { partners: true, clients: true, clientsOnHome: true, portal: true };

/** Which optional sections are switched on in the admin panel. */
export function getFeatures(): FeatureFlags {
  return { ...DEFAULT_FEATURES, ...(getSettings()?.features ?? {}) };
}

export function getPartners(): Partner[] {
  if (!getFeatures().partners) return [];
  return readList<Partner>("partners.json")
    .filter((p) => p.published)
    .sort(byOrder);
}

export function getHomeCopy() {
  return getHomeContent(getTokens());
}

export function getClients(): ClientLogo[] {
  if (!getFeatures().clients) return [];
  return readList<ClientLogo>("clients.json")
    .filter((c) => c.published)
    .sort(byOrder);
}

/** Projects the studio chose to show on the homepage (the "featured" switch). */
export function getFeaturedProjects(): Project[] {
  return getProjects().filter((p) => p.featured);
}

/** Tokens available inside any editable copy: {teamCount}, {companyName}, ... */
export function getTokens(): TokenMap {
  const settings = getSettings();
  return buildTokens(
    {
      team: getTeam().length,
      services: getServices().length,
      projects: getProjects().length,
      tools: countTools(),
    },
    {
      companyName: settings?.companyName || "Quanta",
      contactEmail: settings?.email || "",
    }
  );
}

export function getPages(): PagesContent {
  return readFilled<PagesContent>("pages.json", getTokens());
}

export function getNavigation(): NavigationContent {
  return readFilled<NavigationContent>("navigation.json", getTokens());
}

export function getLegal(): LegalContent {
  return readFilled<LegalContent>("legal.json", getTokens());
}

/** Everything the homepage and the shared page chrome need, in one read. */
export function getSiteData() {
  const services = getServices();
  const projects = getProjects();
  const testimonials = getTestimonials();
  const team = getTeam();

  const tokens = getTokens();
  const features = getFeatures();

  return {
    services,
    projects,
    featuredProjects: projects.filter((p) => p.featured),
    testimonials,
    team,
    partners: getPartners(),
    clients: getClients(),
    features,
    nav: getNavigation(),
    home: getHomeContent(tokens),
    tech: getTechStack(tokens),
    counts: {
      services: services.length,
      projects: projects.length,
      team: team.length,
    },
    nodes: services.map((s, i) => ({
      id: s.id,
      num: s.num || String(i + 1).padStart(2, "0"),
      label: s.title,
    })),
  };
}

export interface SearchEntry {
  group: "Page" | "Project" | "Journal";
  label: string;
  hint?: string;
  href: string;
}

/** Compact index for the command palette. */
export function getSearchIndex(): SearchEntry[] {
  const nav = getNavigation();
  const features = getFeatures();
  const pages = visibleLinks([...nav.links, ...nav.extraSearch], features).map<SearchEntry>(
    (l) => ({ group: "Page", label: l.name, hint: l.hint, href: l.path })
  );

  return [
    { group: "Page", label: nav.mobileHomeLabel, href: "/" },
    ...pages,
    ...getProjects().map<SearchEntry>((p) => ({
      group: "Project",
      label: p.title,
      hint: p.category,
      href: `/projects/${p.slug}`,
    })),
    ...getPosts().map<SearchEntry>((p) => ({
      group: "Journal",
      label: p.title,
      hint: p.tags?.[0],
      href: `/blog/${p.slug}`,
    })),
  ];
}
