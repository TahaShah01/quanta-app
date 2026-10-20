// Quanta — Shared TypeScript Types
// All data entities used across the app and admin portal


export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  github?: string;
  linkedin?: string;
}

export interface ManagedSocialLink {
  id: string;
  platform: string;
  label: string;
  ariaLabel?: string;
  url: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface TeamMember {
  id: string;
  num: string;
  name: string;
  initials: string;
  role: string;
  shortBio: string;
  expertise: string[];
  image: string;
  socialLinks: SocialLinks;
  order: number;
}

export interface Project {
  id: string;
  num: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  overview: string;
  approach: string;
  outcome: string;
  results: string[];
  technologies: string[];
  images: string[];
  year: string;
  teamMembers: string[];
  liveUrl: string;
  visualType: "alpha" | "nova" | "orbit" | "custom";
  featured: boolean;
  published: boolean;
  order: number;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientRole: string;
  clientCompany: string;
  quote: string;
  avatar: string;
  rating: number;
  projectId?: string;
  published: boolean;
  order: number;
}

export interface Service {
  id: string;
  num: string;
  title: string;
  icon: string;
  shortDesc: string;
  description: string;
  features: string[];
  published: boolean;
  order: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  authorRole: string;
  authorImage: string;
  tags: string[];
  readTime: number;
  published: boolean;
  publishedAt: string;
  seo: {
    title: string;
    description: string;
  };
}

export interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  type: "feature" | "fix" | "update";
  date: string;
  published: boolean;
}

export interface AvailabilityConfig {
  enabled: boolean;
  message: string;
  badge_color: string;
}

export interface AnalyticsConfig {
  ga4_measurement_id: string;
}

/** Sections the studio can switch off completely from the admin panel. */
export interface FeatureFlags {
  /** "Partners" block on the People page */
  partners: boolean;
  /** "Closely working with" client wall (People page, optionally the homepage too) */
  clients: boolean;
  /** Also show the client wall on the homepage */
  clientsOnHome: boolean;
  /** Client portal login and dashboard */
  portal: boolean;
}

export interface SeoSettings {
  siteUrl: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface Partner {
  id: string;
  name: string;
  /** A person or a company */
  kind: "individual" | "company";
  /** What the partnership is, e.g. "Sends us clients" */
  role: string;
  description: string;
  logo: string;
  website: string;
  since: string;
  published: boolean;
  order: number;
}

export interface ClientLogo {
  id: string;
  name: string;
  logo: string;
  website: string;
  /** Short line shown on hover, e.g. what we built for them */
  note: string;
  published: boolean;
  order: number;
}

export interface WhatsAppConfig {
  /** International format without +, e.g. "923001234567" */
  number: string;
  /** Pre-filled message sent when opening WhatsApp chat */
  message: string;
  /** Whether the floating button is visible on public pages */
  visible: boolean;
}

export interface SiteSettings {
  companyName: string;
  tagline: string;
  email: string;
  location: string;
  phone: string;
  socials: SocialLinks;
  /** Modern dynamic social links with ordering, safe icons, and enable/disable states */
  socialLinks?: ManagedSocialLink[];
  availability: AvailabilityConfig;
  analytics: AnalyticsConfig;
  contact_api_endpoint: string;
  og_image: string;
  stats: Array<{ number: string; label: string }>;
  features: FeatureFlags;
  seo: SeoSettings;
  /** IANA zone shown on the footer clock, e.g. "Asia/Karachi" */
  timezone: string;
  /** WhatsApp floating contact button */
  whatsapp?: WhatsAppConfig;
}
