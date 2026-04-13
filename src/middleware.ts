import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ONLY_PAGES   = ["/categories", "/items", "/reports", "/settings"];
const AUTH_PAGES         = ["/login", "/staff-login"];
const PROTECTED_PREFIXES = ["/dashboard", "/sales", "/expenses", "/categories", "/items", "/reports", "/settings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const role: string = (req.auth as any)?.user?.role ?? "";

  // Always pass Next.js internals and auth API without modification
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    if (AUTH_PAGES.includes(pathname) || pathname === "/") {
      return addNoCacheHeaders(NextResponse.next());
    }
    // Use req.url so the redirect stays on the correct domain (never localhost)
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ── Already logged in on auth page → go to app ───────────────────────────────
  if (AUTH_PAGES.includes(pathname)) {
    const dest = role === "ADMIN" ? "/dashboard" : "/sales";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ── Root → redirect to role home ─────────────────────────────────────────────
  if (pathname === "/") {
    const dest = role === "ADMIN" ? "/dashboard" : "/sales";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ── STAFF: block admin-only pages ────────────────────────────────────────────
  if (role === "STAFF" && ADMIN_ONLY_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/sales", req.url));
  }

  // ── Authenticated protected page: stamp no-cache so back-button re-validates ──
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected) {
    return addNoCacheHeaders(NextResponse.next());
  }

  return NextResponse.next();
});

/** Prevent browser/CDN caching of authenticated or auth pages */
function addNoCacheHeaders(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
