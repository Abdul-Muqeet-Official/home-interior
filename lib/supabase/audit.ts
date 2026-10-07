/**
 * lib/supabase/audit.ts
 * Audit logging helper (server-only, privileged client).
 * Never log sensitive values such as tokens or passwords.
 */

import { supabaseAdmin } from "./admin";
import type { AuditLogRow } from "./types";

export async function logAudit(
  action: string,
  actorId?: string,
  metadata?: Record<string, unknown>
) {
  const admin = supabaseAdmin;
  if (!admin) return;

  const payload: Partial<AuditLogRow> = {
    action,
    actor_id: actorId ?? null,
    metadata: metadata ?? {},
  };

  const { error } = await admin.from("audit_logs").insert(payload);
  if (error) {
    // Never break the main flow because of an audit write.
    console.warn("[home-interior] failed to write audit log:", error.message);
  }
}
