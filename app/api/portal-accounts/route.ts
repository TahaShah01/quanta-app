import { NextResponse } from "next/server";
import { generatePassword } from "@/lib/auth";
import { createAccount, listAccounts, toPublic, type PortalAccount } from "@/lib/portal";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(listAccounts().map(toPublic));
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Partial<PortalAccount> & { password?: string };
    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    // The plain password is returned once so the admin can pass it to the client.
    const password = body.password?.trim() || generatePassword();
    const account = createAccount({ ...body, name: body.name, email: body.email }, password);
    return NextResponse.json({ account: toPublic(account), password }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
