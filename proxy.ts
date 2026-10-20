import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, adminMode, readSession } from "@/lib/auth";

// Gate for the admin panel and every write to the content API.
// Public routes (site pages, contact form, portal sign-in) pass straight through.

const PUBLIC_API_POSTS = new Set([
  "/api/contact",
  "/api/admin/login",
  "/api/admin/logout",
  "/api/portal/login",
  "/api/portal/logout",
]);

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const mode = adminMode();

  const isAdminPage = pathname.startsWith("/admin");
  const isApi = pathname.startsWith("/api/");
  if (!isAdminPage && !isApi) return NextResponse.next();

  if (pathname === "/admin/login") return NextResponse.next();
  if (isApi && PUBLIC_API_POSTS.has(pathname) && request.method === "POST") {
    return NextResponse.next();
  }
  // /api/portal/me is checked by its own handler (client cookie, not admin).
  if (pathname === "/api/portal/me") return NextResponse.next();

  const publicRead =
    isApi &&
    (request.method === "GET" || request.method === "HEAD") &&
    searchParams.get("published") !== "false" &&
    !pathname.startsWith("/api/portal-accounts") &&
    !pathname.startsWith("/api/content");
  if (publicRead) return NextResponse.next();

  if (mode === "open") return NextResponse.next();

  const session = readSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (mode === "password" && session?.role === "admin") return NextResponse.next();

  if (isApi) {
    return NextResponse.json(
      { error: mode === "locked" ? "Admin is locked: set ADMIN_PASSWORD and SESSION_SECRET." : "Sign in required." },
      { status: mode === "locked" ? 503 : 401 }
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
