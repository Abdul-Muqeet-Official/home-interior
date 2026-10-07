/**
 * lib/supabase/server.ts
 * Server-side Supabase client for normal application queries (API routes, RSC).
 * Uses the same public anon key as the browser client, so RLS is always enforced.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./public";

export function getServerSupabase(): SupabaseClient | null {
  return getSupabaseServerClient();
}

/** Convenience handle; null when Supabase is not configured. */
export const supabase = getSupabaseServerClient();
