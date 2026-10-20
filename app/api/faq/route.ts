import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { FaqItem } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const items = readJSON<FaqItem[]>("faq.json");
  const filtered = all ? items : items.filter(f => f.published);
  return NextResponse.json([...filtered].sort((a, b) => a.order - b.order));
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  const items = readJSON<FaqItem[]>("faq.json");
  const newItem: FaqItem = { ...body, id: `faq-${Date.now()}`, order: items.length + 1 };
  items.push(newItem);
  writeJSON("faq.json", items);
  return NextResponse.json(newItem, { status: 201 });
}
