import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { SiteSettings } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const settings = readJSON<SiteSettings>("settings.json");
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  const current = readJSON<SiteSettings>("settings.json");
  const updated = { ...current, ...body };
  writeJSON("settings.json", updated);
  return NextResponse.json(updated);
}
