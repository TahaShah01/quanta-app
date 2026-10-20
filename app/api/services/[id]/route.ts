import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { Service } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();
  const items = readJSON<Service[]>("services.json");
  const idx = items.findIndex((s) => s.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = { ...items[idx], ...body, id };
  writeJSON("services.json", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const items = readJSON<Service[]>("services.json");
  writeJSON("services.json", items.filter((s) => s.id !== id));
  return NextResponse.json({ success: true });
}
