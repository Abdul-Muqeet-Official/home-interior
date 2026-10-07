/**
 * lib/supabase/public.ts
 * Server-side Supabase client for public (anonymous) catalogue reads.
 *
 * - Uses the anon/publishable key only, so Row Level Security still applies.
 * - Never throws: when credentials are missing the data layer degrades to the
 *   local studio catalogue instead of crashing a page or the build.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabaseEnv } from "./env";

/** Seconds before cached catalogue reads are refreshed. */
export const CATALOGUE_REVALIDATE = 300;

let cached: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (cached) return cached;
  const env = readPublicSupabaseEnv();
  if (!env) return null;

  cached = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: ((input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
          ...init,
          next: { revalidate: CATALOGUE_REVALIDATE },
        } as RequestInit)) as typeof fetch,
    },
  });

  return cached;
}

export function getSupabaseBaseUrl(): string | null {
  return readPublicSupabaseEnv()?.url ?? null;
}
