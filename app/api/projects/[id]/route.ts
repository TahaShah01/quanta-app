import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { Project } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const projects = readJSON<Project[]>("projects.json");
  const project = projects.find((p) => p.id === id || p.slug === id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();
  const projects = readJSON<Project[]>("projects.json");
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  projects[idx] = { ...projects[idx], ...body, id };
  writeJSON("projects.json", projects);
  return NextResponse.json(projects[idx]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const projects = readJSON<Project[]>("projects.json");
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  writeJSON("projects.json", filtered);
  return NextResponse.json({ success: true });
}
