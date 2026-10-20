import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PORTAL_COOKIE, readSession, verifyPassword } from "@/lib/auth";
import { findById, toPublic, updateAccount } from "@/lib/portal";
import { getFeatures } from "@/lib/site";

// Reads the session cookie, so it is always rendered per request (the portal polls this).
export async function GET() {
  if (!getFeatures().portal) {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }
  const store = await cookies();
  const session = readSession(store.get(PORTAL_COOKIE)?.value);
  // "Not signed in" is a normal answer for the login screen, so it is a 200 (no red console noise).
  const signedOut = NextResponse.json({ account: null }, { headers: { "Cache-Control": "no-store" } });
  if (!session || session.role !== "client") return signedOut;
  const account = findById(session.sub);
  if (!account || !account.active) return signedOut;
  return NextResponse.json(
    { account: toPublic(account) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: Request) {
  if (!getFeatures().portal) {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }
  const store = await cookies();
  const session = readSession(store.get(PORTAL_COOKIE)?.value);
  if (!session || session.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = findById(session.sub);
  if (!account || !account.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, company, currentPassword, newPassword } = body;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password." },
          { status: 400 }
        );
      }
      if (!verifyPassword(currentPassword, account.passwordHash)) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters." },
          { status: 400 }
        );
      }
    }

    const updated = updateAccount(
      account.id,
      {
        name: name ? String(name).trim() : account.name,
        company: company !== undefined ? String(company).trim() : account.company,
      },
      newPassword
    );

    if (!updated) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    return NextResponse.json({ account: toPublic(updated) });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
