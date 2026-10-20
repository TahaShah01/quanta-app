import { NextResponse } from "next/server";
import { generatePassword } from "@/lib/auth";
import { deleteAccount, toPublic, updateAccount, type PublicAccount } from "@/lib/portal";
import { requireAdmin } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json()) as Partial<PublicAccount> & {
    password?: string;
    resetPassword?: boolean;
  };
  const { password, resetPassword, ...patch } = body;
  const newPassword = resetPassword ? generatePassword() : password?.trim() || undefined;
  const account = updateAccount(id, patch, newPassword);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ account: toPublic(account), password: newPassword });
}

export async function DELETE(_req: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!deleteAccount(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
