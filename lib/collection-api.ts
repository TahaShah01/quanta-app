// Shared route handlers for simple ordered collections (partners, clients, testimonials, etc.).
// All mutating operations (POST, PUT, DELETE) require an admin session.
import { NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/content";
import { requireAdmin } from "@/lib/api-auth";

interface Item {
  id: string;
  order: number;
  published: boolean;
}

type Params = { params: Promise<{ id: string }> };

function read<T>(file: string): T[] {
  try {
    return readJSON<T[]>(file);
  } catch {
    return [];
  }
}

export function collectionHandlers<T extends Item>(file: string, idPrefix: string) {
  return {
    list: async (request: Request) => {
      const publishedOnly = new URL(request.url).searchParams.get("published") !== "false";
      const items = read<T>(file)
        .filter((i) => !publishedOnly || i.published)
        .sort((a, b) => a.order - b.order);
      return NextResponse.json(items);
    },

    create: async (request: Request) => {
      const denied = await requireAdmin();
      if (denied) return denied;
      try {
        const body = await request.json();
        const items = read<T>(file);
        const created = {
          published: false,
          ...body,
          id: `${idPrefix}-${Date.now()}`,
          order: items.length + 1,
        } as T;
        items.push(created);
        writeJSON(file, items);
        return NextResponse.json(created, { status: 201 });
      } catch {
        return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
      }
    },

    update: async (request: Request, { params }: Params) => {
      const denied = await requireAdmin();
      if (denied) return denied;
      const { id } = await params;
      const body = await request.json();
      const items = read<T>(file);
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
      items[index] = { ...items[index], ...body, id };
      writeJSON(file, items);
      return NextResponse.json(items[index]);
    },

    remove: async (_request: Request, { params }: Params) => {
      const denied = await requireAdmin();
      if (denied) return denied;
      const { id } = await params;
      const items = read<T>(file);
      const next = items.filter((i) => i.id !== id);
      if (next.length === items.length) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      writeJSON(file, next);
      return NextResponse.json({ success: true });
    },
  };
}
