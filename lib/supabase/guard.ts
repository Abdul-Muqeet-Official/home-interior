/**
 * lib/supabase/guard.ts
 *
 * The single authorisation gate for every /api/admin/* route handler.
 *
 * Route handlers in this project run on the service-role client (RLS bypassed), so
 * the guard is the authoritative boundary: no session, no data — not even reads.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest, type AdminSession } from "./session";

const UNAUTHORIZED = {
  error: "Sign in to the admin console to continue.",
  code: "unauthorized",
} as const;

/**
 * Returns a 401 response when the request carries no valid administrative session,
 * otherwise null. Usage:
 *
 *   const denied = await adminGuard(request);
 *   if (denied) return denied;
 */
export async function adminGuard(request: NextRequest): Promise<NextResponse | null> {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return NextResponse.json({ ...UNAUTHORIZED }, { status: 401 });
  return null;
}

/** Guard that also hands back the resolved session for audit fields. */
export async function adminGuardWithSession(
  request: NextRequest
): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return { response: NextResponse.json({ ...UNAUTHORIZED }, { status: 401 }) };
  }
  return { session };
}
