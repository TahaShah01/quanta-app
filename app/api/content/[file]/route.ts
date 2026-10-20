import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import { CONTENT_FILES } from "@/lib/content-files";
import { requireAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ file: string }> };

function resolve(key: string) {
  return CONTENT_FILES.find((f) => f.key === key);
}

export async function GET(_req: Request, { params }: Params) {
  const { file } = await params;
  const entry = resolve(file);
  if (!entry) return NextResponse.json({ error: "Unknown content file" }, { status: 404 });
  try {
    return NextResponse.json(readJSON(entry.file));
  } catch {
    return NextResponse.json({ error: "Failed to read content" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { file } = await params;
  const entry = resolve(file);
  if (!entry) return NextResponse.json({ error: "Unknown content file" }, { status: 404 });
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
    }
    writeJSON(entry.file, body);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}
