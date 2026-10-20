import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { ChangelogEntry } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const items = readJSON<ChangelogEntry[]>("changelog.json");
  const filtered = all ? items : items.filter(c => c.published);
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  const items = readJSON<ChangelogEntry[]>("changelog.json");
  const newItem: ChangelogEntry = { ...body, id: `changelog-${Date.now()}`, date: body.date || new Date().toISOString().split("T")[0] };
  items.push(newItem);
  writeJSON("changelog.json", items);
  return NextResponse.json(newItem, { status: 201 });
}
