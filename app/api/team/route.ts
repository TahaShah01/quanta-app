import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { TeamMember } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    const team = readJSON<TeamMember[]>("team.json");
    const sorted = [...team].sort((a, b) => a.order - b.order);
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json({ error: "Failed to read team data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const team = readJSON<TeamMember[]>("team.json");
    const newMember: TeamMember = {
      ...body,
      id: `member-${Date.now()}`,
      num: String(team.length + 1).padStart(2, "0"),
      order: team.length + 1,
    };
    team.push(newMember);
    writeJSON("team.json", team);
    return NextResponse.json(newMember, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
