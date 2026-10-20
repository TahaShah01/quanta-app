import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { Testimonial } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();
  const items = readJSON<Testimonial[]>("testimonials.json");
  const idx = items.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = { ...items[idx], ...body, id };
  writeJSON("testimonials.json", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const items = readJSON<Testimonial[]>("testimonials.json");
  writeJSON("testimonials.json", items.filter((t) => t.id !== id));
  return NextResponse.json({ success: true });
}
