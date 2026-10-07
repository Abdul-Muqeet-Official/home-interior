/**
 * middleware.ts
 *
 * Edge gate for the whole admin surface.
 *
 * This is a real authorisation boundary, not a cookie-presence check: the token is
 * validated against Supabase Auth and the account must hold an administrative role
 * (public.profiles.role, or the server-only ADMIN_EMAILS allow-list), so a forged or
 * expired cookie reaches nothing. Verification fails closed.
 *
 * Route handlers additionally call `adminGuard()` before touching the service-role
 * client, as defense in depth.
 *
 * Public surfaces and /our-work are untouched by this matcher.
 */

import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isPublicAdminPath } from "@/lib/supabase/session-cookie";
import { verifyAdminToken } from "@/lib/supabase/session";

const UNAUTHENTICATED = {
  error: "Sign in to the admin console to continue.",
  code: "unauthorized",
} as const;

function deny(request: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ...UNAUTHENTICATED }, { status: 401 });
  }

  const signIn = request.nextUrl.clone();
  signIn.pathname = "/admin/login";
  signIn.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
  const redirect = NextResponse.redirect(signIn);
  redirect.cookies.delete(ADMIN_SESSION_COOKIE);
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAdminPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return deny(request, pathname);

  const session = await verifyAdminToken(token);
  if (!session) return deny(request, pathname);

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
