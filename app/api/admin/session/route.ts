/**
 * app/api/admin/session/route.ts
 *
 * Admin sign-in / status / sign-out.
 *
 * POST   { email, password } → validates against Supabase Auth (anon key), confirms the
 *                              account holds an administrative role, then stores the
 *                              access token in an HttpOnly cookie.
 * GET                        → current session status.
 * DELETE                     → clears the cookie.
 *
 * The service-role key is never used to authenticate a person and never leaves the server.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readPublicSupabaseEnv } from "@/lib/supabase/env";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionFromRequest,
  verifyAdminToken,
} from "@/lib/supabase/session";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

/** Eight hours — a working session, short enough to limit a stolen cookie. */
const SESSION_MAX_AGE = 60 * 60 * 8;

const NOT_CONFIGURED = NextResponse.json(
  {
    error:
      "Admin sign-in is unavailable: SUPABASE_URL / SUPABASE_ANON_KEY are not set on the server.",
    code: "admin-not-configured",
  },
  { status: 503 }
);

export async function POST(request: NextRequest) {
  const env = readPublicSupabaseEnv();
  if (!env) return NOT_CONFIGURED;

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A JSON body is required." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const auth = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  const token = data?.session?.access_token;
  if (error || !token) {
    // Deliberately identical for unknown user and wrong password.
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = await verifyAdminToken(token);
  if (!session) {
    return NextResponse.json(
      {
        error:
          "This account is not authorised for the admin console. Grant the role in public.profiles, or list the email in ADMIN_EMAILS on the server.",
        code: "forbidden",
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    email: session.email,
    role: session.role,
  });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    role: session.role,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
