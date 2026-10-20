import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { TeamMember } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const team = readJSON<TeamMember[]>("team.json");
  const member = team.find((m) => m.id === id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();
  const team = readJSON<TeamMember[]>("team.json");
  const idx = team.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  team[idx] = { ...team[idx], ...body, id };
  writeJSON("team.json", team);
  return NextResponse.json(team[idx]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const team = readJSON<TeamMember[]>("team.json");
  const filtered = team.filter((m) => m.id !== id);
  if (filtered.length === team.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  writeJSON("team.json", filtered);
  return NextResponse.json({ success: true });
}
