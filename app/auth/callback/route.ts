import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/account";

  if (code) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        const role = data.user.app_metadata?.role || data.user.user_metadata?.role;
        const isAdmin = role === "admin" || data.user.email === "sulemanrashid115@gmail.com";
        const redirectPath = isAdmin ? "/admin" : next;
        return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
      }
    }
  }

  // Fallback redirect to login with error or account
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}

