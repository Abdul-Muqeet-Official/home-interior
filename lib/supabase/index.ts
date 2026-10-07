/**
 * lib/supabase/index.ts
 * Browser-safe entry point: public client + row types only.
 * Server-side data access lives in `./queries` and must be imported directly from
 * server components / route handlers (it reads the anon key server-side and uses RLS).
 */

export { supabase, getBrowserSupabase } from "./client";
export type {
  CategoryRow,
  ProductRow,
  ProjectRow,
  ReviewRow,
  ServiceRow,
  SiteSettingsRow,
  LeadInsert,
  MediaRow,
  AuditLogRow,
} from "./types";
