import { NextResponse } from "next/server";
import { readBlogPost, writeBlogPost, deleteBlogPost } from "@/lib/content";
import { requireAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const post = readBlogPost(slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  const existing = readBlogPost(slug);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json();
  const updated = { ...existing, ...body, slug };
  writeBlogPost(slug, updated);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  deleteBlogPost(slug);
  return NextResponse.json({ success: true });
}
