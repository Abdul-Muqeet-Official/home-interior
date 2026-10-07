/**
 * lib/supabase/client.ts
 * Browser Supabase client.
 *
 * Only the public anon/publishable key is ever used here — it is compiled into the
 * client bundle by design and is protected by Row Level Security. The service-role
 * key must never reach this file.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

/** Convenience instance; null when Supabase is not configured. */
export const supabase = getBrowserSupabase();
