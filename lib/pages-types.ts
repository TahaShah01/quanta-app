// Types for content/pages.json, content/navigation.json and content/legal.json.
// Client-safe: no server imports here.

import type { HeroLine, SectionHeaderContent } from "@/lib/home-types";

export interface PageMeta {
  title: string;
  description: string;
}

export interface PageHeroContent {
  eyebrow: string;
  lines: HeroLine[];
  body?: string;
  /** Word shown after the count in the hero corner, e.g. "people" */
  metaLabel?: string;
}

export interface CardItem {
  num: string;
  title: string;
  description: string;
}

export interface PagesContent {
  about: {
    meta: PageMeta;
    hero: PageHeroContent;
    why: { title: string; paragraphs: string[] };
    values: { eyebrow: string; title: string[]; items: CardItem[] };
    process: { eyebrow: string; title: string[]; items: CardItem[] };
  };
  services: {
    meta: PageMeta;
    hero: PageHeroContent;
    deliverablesLabel: string;
    askLabel: string;
    framework: {
      eyebrow: string;
      title: string[];
      description?: string;
      items: Array<{ step: string; name: string; desc: string }>;
    };
  };
  projects: {
    meta: PageMeta;
    hero: PageHeroContent;
  };
  people: {
    meta: PageMeta;
    hero: PageHeroContent;
    expertiseLabel: string;
    connectLabel: string;
    partners: SectionHeaderContent & {
      sinceLabel: string;
      visitLabel: string;
    };
  };
  blog: {
    meta: PageMeta;
    hero: PageHeroContent;
    emptyMessage: string;
    featuredLabel: string;
    readLabel: string;
    detail: {
      writtenBy: string;
      ctaLabel: string;
      moreLabel: string;
      minRead: string;
      notFoundTitle: string;
      fallbackEyebrow: string;
      backLabel: string;
    };
  };
  contact: {
    meta: PageMeta;
    hero: PageHeroContent;
    info: {
      emailLabel: string;
      locationLabel: string;
      responseLabel: string;
      responseValue: string;
    };
    engage: {
      title: string;
      items: Array<{ icon: string; title: string; description: string }>;
    };
    form: {
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      companyLabel: string;
      companyPlaceholder: string;
      budgetLabel: string;
      budgetOptions: string[];
      messageLabel: string;
      messagePlaceholder: string;
      submit: string;
      sending: string;
      successTitle: string;
      successBody: string;
    };
  };
  projectDetail: {
    notFoundTitle: string;
    chapters: Array<{ label: string; title: string; fallback: string }>;
    statLabels: { technologies: string; people: string; shipped: string; result: string };
    backLabel: string;
    liveLabel: string;
    classificationLabel: string;
    releaseLabel: string;
    stackLabel: string;
    teamLabel: string;
    ctaFallback: string;
  };
  changelog: { meta: PageMeta; hero: PageHeroContent };
  portal: {
    meta: PageMeta;
    hero: PageHeroContent;
    login: {
      title: string;
      description: string;
      emailLabel: string;
      passwordLabel: string;
      button: string;
      signingIn: string;
      error: string;
      help: string;
      helpLink: { label: string; href: string };
    };
    disabled: {
      title: string;
      body: string;
      button: { label: string; href: string };
    };
    dashboard: {
      greeting: string;
      liveLabel: string;
      progressLabel: string;
      milestonesLabel: string;
      updatesLabel: string;
      linksLabel: string;
      statusLabel: string;
      targetLabel: string;
      startLabel: string;
      emptyUpdates: string;
      emptyMilestones: string;
      signOut: string;
      statusLabels: Record<string, string>;
      milestoneLabels: Record<string, string>;
      dueLabel: string;
      syncedLabel: string;
    };
  };
  notFound: { code: string; title: string; body: string; button: string };
}

export type FeatureKey = "partners" | "clients" | "portal";

export interface NavLinkContent {
  name: string;
  path: string;
  hint?: string;
  feature?: FeatureKey;
}

export interface FooterLink {
  label: string;
  href: string;
  feature?: FeatureKey;
}

export interface NavigationContent {
  links: NavLinkContent[];
  extraSearch: NavLinkContent[];
  contactButton: { label: string; href: string };
  mobileHomeLabel: string;
  mobileContactLabel: string;
  footer: {
    helloLabel: string;
    clockLabel: string;
    columns: Array<{ title: string; links: FooterLink[] }>;
    connectTitle: string;
    legalLinks: FooterLink[];
    copyright: string;
    backToTop: string;
    copyEmail: string;
    copied: string;
  };
}

export interface LegalDocument {
  meta: PageMeta;
  eyebrow: string;
  title: string;
  updated: string;
  sections: Array<{ heading: string; body: string }>;
}

export interface LegalContent {
  privacy: LegalDocument;
  terms: LegalDocument;
}
