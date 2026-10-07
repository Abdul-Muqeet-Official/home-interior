/**
 * lib/supabase/env.ts
 * Environment resolution for Supabase.
 *
 * Public (anon/publishable) credentials may be supplied under either the
 * NEXT_PUBLIC_* names used by the browser or the plain server-side names.
 * The service-role key is never read here.
 */

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

export function readPublicSupabaseEnv(): SupabasePublicEnv | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!url || !anonKey) return null;
  if (!/^https?:\/\//i.test(url)) return null;

  return { url, anonKey };
}

export function readServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key ? key : null;
}

export function isSupabaseConfigured(): boolean {
  return readPublicSupabaseEnv() !== null;
}
