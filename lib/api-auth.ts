// Shared API route authorization helpers.
// All mutating admin endpoints must call requireAdmin() before performing any write.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminMode, readSession } from "@/lib/auth";

/** Returns true if the request carries a valid admin session (or admin is in open-dev mode). */
export async function isAdminAuthed(): Promise<boolean> {
  const mode = adminMode();
  if (mode === "open") return true;        // local dev without ADMIN_PASSWORD
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const session = readSession(token);
  return session?.role === "admin";
}

/** Call at the top of any mutating admin API route handler.
 *  Returns a 401 NextResponse when not authorized, or null when authorized. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdminAuthed()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
