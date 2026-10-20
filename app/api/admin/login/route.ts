import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminMode,
  clearAttempts,
  createSession,
  safeEqual,
  tooManyAttempts,
} from "@/lib/auth";

const SESSION_SECONDS = 60 * 60 * 12;

export async function POST(request: Request) {
  const mode = adminMode();
  if (mode === "open") return NextResponse.json({ ok: true, open: true });
  if (mode === "locked") {
    return NextResponse.json(
      { error: "Admin is locked. Set ADMIN_PASSWORD and SESSION_SECRET on the server." },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `admin:${ip}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!password || !safeEqual(password, process.env.ADMIN_PASSWORD ?? "")) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = createSession("admin", "admin", SESSION_SECONDS);
  if (!token) return NextResponse.json({ error: "SESSION_SECRET is not set." }, { status: 503 });

  clearAttempts(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return response;
}
