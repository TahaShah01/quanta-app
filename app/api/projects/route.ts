import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import type { Project } from "@/lib/types";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get("published") !== "false";
    const projects = readJSON<Project[]>("projects.json");
    const filtered = publishedOnly ? projects.filter((p) => p.published) : projects;
    const sorted = [...filtered].sort((a, b) => a.order - b.order);
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json({ error: "Failed to read projects data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const projects = readJSON<Project[]>("projects.json");
    const newProject: Project = {
      ...body,
      id: `project-${Date.now()}`,
      num: String(projects.length + 1).padStart(2, "0"),
      order: projects.length + 1,
      published: body.published ?? false,
    };
    projects.push(newProject);
    writeJSON("projects.json", projects);
    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
