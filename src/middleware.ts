import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes only admins can visit
const ADMIN_ONLY_PAGES = ["/categories", "/items", "/reports", "/settings"];

// Auth pages (redirect away when already logged in)
const AUTH_PAGES = ["/login", "/staff-login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const role: string = (req.auth as any)?.user?.role ?? "";

  // Always allow Next.js internals and API auth routes
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    if (AUTH_PAGES.includes(pathname) || pathname === "/") {
      return NextResponse.next();
    }
    // Send to portal selector rather than generic /login
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ── Already logged in, visiting an auth page ─────────────────────────────────
  if (AUTH_PAGES.includes(pathname)) {
    const dest = role === "ADMIN" ? "/dashboard" : "/sales";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ── Root page: redirect to the right home ─────────────────────────────────────
  if (pathname === "/") {
    const dest = role === "ADMIN" ? "/dashboard" : "/sales";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ── STAFF: block any admin-only page ────────────────────────────────────────
  if (role === "STAFF" && ADMIN_ONLY_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/sales", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match everything except static files.
     * Runs on: pages, API routes, /login, /staff-login, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
