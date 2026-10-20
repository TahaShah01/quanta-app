import { readBlogPost } from "@/lib/content";
import { getPosts } from "@/lib/site";
import { OG_SIZE, OG_TYPE, ogCard } from "@/lib/og";
import type { BlogPost } from "@/lib/types";

export const alt = "Article preview";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export async function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = readBlogPost(slug) as BlogPost | null;

  return ogCard({
    kicker: post?.tags?.[0] ? `Journal / ${post.tags[0]}` : "Journal",
    title: post?.title ?? "Journal",
    description: post?.excerpt,
    footerLeft: post
      ? `${post.author}  ·  ${post.readTime} min read`
      : undefined,
  });
}
