import { NextResponse } from "next/server";
import {
  PORTAL_COOKIE,
  clearAttempts,
  createSession,
  burnHashTime,
  tooManyAttempts,
  verifyPassword,
} from "@/lib/auth";
import { findByEmail, markLogin } from "@/lib/portal";
import { getFeatures } from "@/lib/site";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  if (!getFeatures().portal) {
    return NextResponse.json({ error: "The client portal is switched off." }, { status: 403 });
  }

  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `portal:${ip}:${email.toLowerCase()}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const account = findByEmail(email);
  // Run a hash even for unknown emails so response time doesn't reveal which exist.
  const ok = account ? verifyPassword(password, account.passwordHash) : (burnHashTime(password), false);

  if (!account || !ok || !account.active) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const token = createSession(account.id, "client", SESSION_SECONDS);
  if (!token) {
    return NextResponse.json({ error: "Portal sign-in is not configured (SESSION_SECRET)." }, { status: 503 });
  }

  clearAttempts(key);
  markLogin(account.id);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PORTAL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return response;
}
