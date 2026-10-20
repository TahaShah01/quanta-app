import { NextResponse, connection } from "next/server";
import { adminMode } from "@/lib/auth";

// Tells the admin UI whether sign-in is in force (so it can show "Sign out").
// Read per request: the mode depends on server env, not on build-time state.
export async function GET() {
  await connection();
  return NextResponse.json({ mode: adminMode() }, { headers: { "Cache-Control": "no-store" } });
}
