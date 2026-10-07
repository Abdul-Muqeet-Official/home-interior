import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type UserRole = "customer" | "editor" | "admin" | "owner";

export interface UserProfileRecord {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string | null;
}

const PROFILES_FILE = path.join(process.cwd(), "lib", "content", "profiles_store.json");

function getBootstrapEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "admin@homeinterior.pk")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getStoredProfiles(): UserProfileRecord[] {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[profiles-store] Failed to read profiles file:", err);
  }
  return [];
}

export function saveStoredProfiles(profiles: UserProfileRecord[]): void {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (err) {
    console.error("[profiles-store] Failed to write profiles file:", err);
  }
}

/**
 * Authoritative server-side role resolution for a user.
 * 1. Checks public.profiles table in Supabase.
 * 2. Checks auth.users app_metadata.role via supabaseAdmin.
 * 3. Checks server profiles store.
 * 4. Checks ADMIN_EMAILS bootstrap allowlist.
 * Defaults to "customer".
 */
export async function getUserRole(userId: string, emailHint?: string | null): Promise<UserRole> {
  // 1. Try public.profiles table
  if (supabaseAdmin) {
    try {
      const { data: profileRow } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (profileRow?.role && ["customer", "editor", "admin", "owner"].includes(profileRow.role)) {
        return profileRow.role as UserRole;
      }
    } catch {
      // Table may not exist yet in schema cache
    }
  }

  // 2. Try Supabase Auth app_metadata (tamper-proof server metadata)
  let userEmail = emailHint?.toLowerCase() || null;
  if (supabaseAdmin) {
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userData?.user) {
        if (!userEmail && userData.user.email) {
          userEmail = userData.user.email.toLowerCase();
        }
        const appRole = userData.user.app_metadata?.role;
        if (appRole && ["customer", "editor", "admin", "owner"].includes(appRole)) {
          return appRole as UserRole;
        }
      }
    } catch {
      // Non-blocking
    }
  }

  // 3. Try server profiles store
  const stored = getStoredProfiles();
  const found = stored.find((p) => p.id === userId);
  if (found) {
    return found.role;
  }

  // 4. Server-side bootstrap allowlist
  if (userEmail && getBootstrapEmails().includes(userEmail)) {
    return "admin";
  }

  return "customer";
}

/**
 * Get or create a unified profile record for a user.
 */
export async function getUserProfile(userId: string): Promise<UserProfileRecord | null> {
  if (!supabaseAdmin) return null;

  try {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!userData?.user) return null;

    const user = userData.user;
    const email = user.email || "";
    const role = await getUserRole(userId, email);
    const meta = user.user_metadata || {};

    const profile: UserProfileRecord = {
      id: user.id,
      email,
      role,
      displayName: meta.full_name || meta.fullName || email.split("@")[0] || "Client",
      phone: meta.phone || undefined,
      address: meta.address || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
    };

    return profile;
  } catch (err) {
    console.error("[profiles-store] getUserProfile error:", err);
    return null;
  }
}

/**
 * List all users with their resolved roles and profile information.
 */
export async function listAllUserProfiles(): Promise<UserProfileRecord[]> {
  const result: UserProfileRecord[] = [];
  const stored = getStoredProfiles();
  const storedMap = new Map(stored.map((p) => [p.id, p]));

  if (supabaseAdmin) {
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      if (usersData?.users) {
        for (const u of usersData.users) {
          const email = u.email || "";
          const meta = u.user_metadata || {};
          const appMeta = u.app_metadata || {};

          let role: UserRole = "customer";
          if (appMeta.role && ["customer", "editor", "admin", "owner"].includes(appMeta.role)) {
            role = appMeta.role as UserRole;
          } else if (storedMap.has(u.id)) {
            role = storedMap.get(u.id)!.role;
          } else if (email && getBootstrapEmails().includes(email.toLowerCase())) {
            role = "admin";
          }

          result.push({
            id: u.id,
            email,
            role,
            displayName: meta.full_name || meta.fullName || email.split("@")[0] || "Client",
            phone: meta.phone || undefined,
            address: meta.address || undefined,
            createdAt: u.created_at,
            updatedAt: u.updated_at || u.created_at,
            lastSignInAt: u.last_sign_in_at || null,
          });
        }
      }
    } catch (err) {
      console.error("[profiles-store] listAllUserProfiles auth error:", err);
    }
  }

  // Include any stored profiles not found in listUsers
  for (const s of stored) {
    if (!result.find((r) => r.id === s.id)) {
      result.push(s);
    }
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Authoritative role update. Requires caller to be an admin or owner.
 * Updates Supabase Auth app_metadata, public.profiles (if present), and local store.
 */
export async function setUserRole(params: {
  userId: string;
  newRole: UserRole;
  callerUserId: string;
}): Promise<{ success: boolean; error?: string; profile?: UserProfileRecord }> {
  const { userId, newRole, callerUserId } = params;

  // Verify caller authorization
  const callerRole = await getUserRole(callerUserId);
  if (callerRole !== "admin" && callerRole !== "owner") {
    return { success: false, error: "Unauthorized: only an administrator may change roles." };
  }

  // Prevent demoting the caller if they are the only admin
  if (userId === callerUserId && newRole === "customer") {
    const all = await listAllUserProfiles();
    const adminCount = all.filter((p) => p.role === "admin" || p.role === "owner").length;
    if (adminCount <= 1) {
      return { success: false, error: "Cannot demote the last remaining administrator." };
    }
  }

  const now = new Date().toISOString();

  // 1. Update Supabase Auth app_metadata (tamper-proof)
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role: newRole },
      });
    } catch (err: unknown) {
      console.warn("[profiles-store] Could not update app_metadata:", err);
    }

    // 2. Best-effort update to public.profiles table
    try {
      await supabaseAdmin.from("profiles").upsert({
        id: userId,
        role: newRole,
        updated_at: now,
      });
    } catch {
      // Table may not exist yet
    }
  }

  // 3. Update persistent store
  const stored = getStoredProfiles();
  const existingIndex = stored.findIndex((p) => p.id === userId);
  let updatedRecord: UserProfileRecord;

  if (existingIndex > -1) {
    stored[existingIndex].role = newRole;
    stored[existingIndex].updatedAt = now;
    updatedRecord = stored[existingIndex];
  } else {
    const targetUser = await getUserProfile(userId);
    updatedRecord = {
      id: userId,
      email: targetUser?.email || "",
      role: newRole,
      displayName: targetUser?.displayName || "Operator",
      createdAt: targetUser?.createdAt || now,
      updatedAt: now,
    };
    stored.push(updatedRecord);
  }

  saveStoredProfiles(stored);

  return { success: true, profile: updatedRecord };
}

