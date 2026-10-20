// Homepage content types (client-safe: no server imports here)
// Backed by content/home.json and content/techstack.json


export interface HomeLink {
  label: string;
  href: string;
}

export interface HeroLine {
  text: string;
  italic?: boolean;
}

export interface SectionHeaderContent {
  /** Short label used by the side rail */
  navLabel: string;
  eyebrow: string;
  /** One entry per line of the heading */
  title: string[];
  description?: string;
  link?: HomeLink;
}

export interface HomeContent {
  ui: {
    railLabel: string;
    scrollHint: string;
    previous: string;
    next: string;
    testimonialsLabel: string;
    clientsLabel?: string;
  };
  hero: {
    navLabel: string;
    eyebrow: string;
    lines: HeroLine[];
    body: string;
    primaryCta: HomeLink;
    secondaryCta: HomeLink;
  };
  preloader: {
    brand: string;
    caption: string;
  };
  manifesto: {
    navLabel: string;
    eyebrow: string;
    text: string;
    /** Label in the middle of the converging-disciplines diagram */
    diagramCenter: string;
    diagramCaption: string;
  };
  /** Values may be numeric tokens such as "{teamCount}" and count up on view */
  stats: {
    items: Array<{ value: string; label: string }>;
  };
  capabilities: SectionHeaderContent;
  techStack: SectionHeaderContent;
  work: SectionHeaderContent & { cardCta: string };
  testimonials: SectionHeaderContent;
  team: SectionHeaderContent;
  clients: SectionHeaderContent;
  cta: {
    navLabel: string;
    lines: HeroLine[];
    subtitle: string;
    button: HomeLink;
  };
}

export interface TechItem {
  name: string;
  role: string;
}

export interface TechCategory {
  category: string;
  items: TechItem[];
}

export interface TechStackContent {
  categories: TechCategory[];
  footnote?: string;
}
