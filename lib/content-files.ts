// Content files the generic admin editor may read and write (/admin/content/<key>).
// Collections with their own admin screens (team, projects...) are not listed here.

export interface ContentFileMeta {
  key: string;
  file: string;
  title: string;
  description: string;
}

export const CONTENT_FILES: ContentFileMeta[] = [
  {
    key: "home",
    file: "home.json",
    title: "Homepage",
    description: "Hero, every homepage section heading, calls to action and the intro screen.",
  },
  {
    key: "pages",
    file: "pages.json",
    title: "Page copy",
    description: "Headlines, body text and labels for About, Services, Projects, People, Blog, Contact, Changelog, Portal and the 404 page.",
  },
  {
    key: "navigation",
    file: "navigation.json",
    title: "Navigation & footer",
    description: "Header links, footer columns and legal links.",
  },
  {
    key: "techstack",
    file: "techstack.json",
    title: "Tech stack",
    description: "The tools shown on the homepage and About page.",
  },
  {
    key: "legal",
    file: "legal.json",
    title: "Legal pages",
    description: "Privacy policy and terms of service text.",
  },
];
