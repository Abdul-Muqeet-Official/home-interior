/**
 * lib/supabase/session-cookie.ts
 *
 * The single cookie name shared by the edge middleware, the admin API guards and
 * the login route. Kept dependency-free so middleware never pulls the Supabase
 * client (or any secret) into the edge bundle.
 */

export const ADMIN_SESSION_COOKIE = "hi_admin_session";

/** Session lifetime, expressed in seconds so it can feed both the cookie and Supabase Auth. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

/**
 * Absolutely nothing on the admin surface may be cached by a browser or an
 * intermediary — every response is account-specific and must be re-authorised.
 */
export const ADMIN_NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
} as const;

/** Routes that must stay reachable without a session: the sign-in screen and the session API. */
export const ADMIN_PUBLIC_PATHS = ["/admin/login", "/api/admin/session"] as const;

export function isPublicAdminPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
