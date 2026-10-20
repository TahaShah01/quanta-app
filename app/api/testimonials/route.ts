import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { Testimonial } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const items = readJSON<Testimonial[]>("testimonials.json");
  return NextResponse.json([...items].filter(t => t.published).sort((a, b) => a.order - b.order));
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  const items = readJSON<Testimonial[]>("testimonials.json");
  const newItem: Testimonial = { ...body, id: `testimonial-${Date.now()}`, order: items.length + 1 };
  items.push(newItem);
  writeJSON("testimonials.json", items);
  return NextResponse.json(newItem, { status: 201 });
}
