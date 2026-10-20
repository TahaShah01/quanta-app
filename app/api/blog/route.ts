import { NextResponse } from "next/server";
import { listBlogPosts, writeBlogPost } from "@/lib/content";
import type { BlogPost } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const posts = listBlogPosts() as BlogPost[];
  const filtered = all ? posts : posts.filter((p) => p.published);
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json() as BlogPost;
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const post: BlogPost = {
    ...body,
    id: `blog-${Date.now()}`,
    slug,
    published: body.published ?? false,
    publishedAt: body.publishedAt || new Date().toISOString(),
  };
  writeBlogPost(slug, post);
  return NextResponse.json(post, { status: 201 });
}
