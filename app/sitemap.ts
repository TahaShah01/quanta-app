import type { MetadataRoute } from "next";
import { readJSON, listBlogPosts } from "@/lib/content";
import { getSiteUrl } from "@/lib/site";
import type { Project, BlogPost } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const staticPages = [
    "",
    "/about",
    "/projects",
    "/services",
    "/people",
    "/blog",
    "/changelog",
    "/contact",
    "/portal",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === "" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  let projectEntries: MetadataRoute.Sitemap = [];
  try {
    const projects = readJSON<Project[]>("projects.json");
    projectEntries = projects
      .filter((p) => p.published)
      .map((p) => ({
        url: `${baseUrl}/projects/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch {
    // fallback
  }

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = listBlogPosts() as BlogPost[];
    blogEntries = blogPosts
      .filter((p) => p.published)
      .map((p) => ({
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified: new Date(p.publishedAt || Date.now()),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // fallback
  }

  return [...staticPages, ...projectEntries, ...blogEntries];
}
