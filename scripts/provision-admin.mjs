import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env
const envFile = fs.readFileSync(".env", "utf-8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim();
});

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = "admin@homeinterior.pk";
  const password = process.env.ADMIN_INITIAL_PASSWORD || "StudioAdminKarachi2026!";

  console.log(`Checking admin user: ${email}...`);
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError);
    return;
  }

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    console.log(`Admin user already exists with ID: ${existing.id}`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      console.error("Failed to update admin password:", updateError);
    } else {
      console.log("Admin password synchronized successfully.");
    }
  } else {
    console.log("Creating new admin user...");
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) {
      console.error("Failed to create admin user:", createError);
    } else {
      console.log(`Created admin user successfully with ID: ${created.user.id}`);
    }
  }
}

main().catch(console.error);

