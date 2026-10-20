import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { Service } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const items = readJSON<Service[]>("services.json");
  const filtered = all ? items : items.filter(s => s.published);
  return NextResponse.json([...filtered].sort((a, b) => a.order - b.order));
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  const items = readJSON<Service[]>("services.json");
  const newItem: Service = { ...body, id: `service-${Date.now()}`, order: items.length + 1 };
  items.push(newItem);
  writeJSON("services.json", items);
  return NextResponse.json(newItem, { status: 201 });
}
