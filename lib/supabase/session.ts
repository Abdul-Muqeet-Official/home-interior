/**
 * lib/supabase/session.ts
 *
 * Server-only admin session resolution.
 *
 * Security model
 * --------------
 * - Login happens server-side (`/api/admin/session`) with the ANON key, never the
 *   service-role key. The resulting access token is stored in an HttpOnly cookie,
 *   so it is unreadable from browser JavaScript.
 * - A token is only accepted when Supabase Auth validates it AND the user holds an
 *   administrative role. Authorisation is read from `public.profiles.role` when the
 *   table exists, otherwise from the server-only ADMIN_EMAILS allow-list (bootstrap).
 * - The service-role key is never exposed here: it is only used for the role lookup
 *   and only when it is configured.
 */

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { readPublicSupabaseEnv } from "./env";
import { supabaseAdmin } from "./admin";
import { ADMIN_SESSION_COOKIE } from "./session-cookie";

export { ADMIN_SESSION_COOKIE };

/** Roles allowed to manage the catalogue. */
const ADMIN_ROLES = new Set(["admin", "editor", "owner"]);

export interface AdminSession {
  userId: string;
  email: string | null;
  role: string;
}

/**
 * Bootstrap allow-list, server-side only. Used until `public.profiles` is migrated
 * (and as a recovery path if the profiles table is ever unavailable).
 * Configure with ADMIN_EMAILS="you@example.com,other@example.com".
 */
function bootstrapEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "admin@homeinterior.pk")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Verify an access token and resolve the administrative role. Returns null when denied. */
export async function verifyAdminToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  const env = readPublicSupabaseEnv();
  if (!env) return null;

  const auth = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await auth.auth.getUser(token);
  if (error || !data?.user) return null;

  const user = data.user;
  const email = user.email?.toLowerCase() ?? null;

  let role: string | null = null;

  // 1. Primary server source: user.app_metadata.role (tamper-proof Supabase Auth claim)
  if (user.app_metadata && typeof user.app_metadata.role === "string") {
    role = user.app_metadata.role.toLowerCase();
  }

  // 2. Canonical DB source: public.profiles.role
  if (!role && supabaseAdmin) {
    try {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role) role = String(profile.role).toLowerCase();
    } catch {
      // profiles not migrated yet — fall through to the bootstrap allow-list.
    }
  }

  // 3. Fallback: bootstrap allow-list
  if (!role && email && bootstrapEmails().includes(email)) {
    role = "admin";
  }

  if (!role || !ADMIN_ROLES.has(role)) return null;

  return { userId: user.id, email, role };
}

/** Session for a route handler, read from the HttpOnly cookie. */
export async function getAdminSessionFromRequest(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminToken(token);
}
