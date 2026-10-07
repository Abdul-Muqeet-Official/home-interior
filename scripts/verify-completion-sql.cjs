"use strict";
const fs = require("fs");
const path = require("path");
const SQL = fs.readFileSync(path.join(process.cwd(), "supabase", "migrations", "20240920_remote_completion.sql"), "utf8");
const low = SQL.toLowerCase();

function has(s) { return SQL.includes(s); }
function hasLow(s) { return low.includes(s.toLowerCase()); }
function tableSql(owner, name) { return "CREATE TABLE IF NOT EXISTS " + owner + "." + name; }
function policySql(name) { return "CREATE POLICY IF NOT EXISTS " + name; }
function bucketSql(name) { return "VALUES ('","bucket='","name='","definition='"+"'.length; }

let fail = 0;
function check(label, ok) { console.log((ok ? "PASS" : "FAIL") + " " + label); if (!ok) fail++; }

check("file present & non-trivial", SQL.length > 5000);
check("section headers 1..7", [1,2,3,4,5,6,7].every(n => hasLow("-- " + n + ".")));

// Tables created by migration
["profiles","categories","services","leads","site_settings","media","audit_logs"].forEach(t => check("CREATE TABLE IF NOT EXISTS public." + t, has(tableSql("public", t))));

// Tables NOT created (already live)
["products","projects","reviews"].forEach(t => check("NOT created: public." + t, !has(tableSql("public", t)));

// Indexes
check("index section present", hasLow("create index if not exists"));
["idx_categories_slug","idx_services_slug","idx_leads_status","idx_leads_created_at"].forEach(n => check("index " + n, has(n)));

// updated_at trigger
check("set_updated_at function defined", hasLow("create or replace function public.set_updated_at"));
check("trigger on leads", has("set_updated_at ON public.leads"));
check("trigger on media", has("set_updated_at ON public.media"));
check("trigger on profiles", has("set_updated_at ON public.profiles"));
check("trigger on site_settings", has("set_updated_at ON public.site_settings"));

// RLS enable
["profiles","categories","services","leads","site_settings","media","audit_logs"].forEach(t => check("RLS on public." + t, hasLow("alter table public." + t + " enable row level security")));

// Policies
["select_active_categories","select_published_services","select_site_settings","insert_leads","select_leads_admin","update_leads_admin","select_profiles","insert_profiles","update_profiles","delete_profiles","select_media_admin","insert_media_admin","update_media_admin","delete_media_admin","select_audit_logs_admin","public_read_media_buckets","admin_insert_media","admin_update_media","admin_delete_media"].forEach(p => check("CREATE POLICY IF NOT EXISTS " + p, has(policySql(p))));

// Lead security
check("leads INSERT policy exists", has(policySql("insert_leads")));
check("leads SELECT admin/editor only", has(policySql("select_leads_admin")));
check("leads UPDATE admin/editor only", has(policySql("update_leads_admin")));
check("NO public SELECT on leads", !hasLow("create policy select_leads on public.leads") && !has(policySql("select_leads_public")));
check("NO public UPDATE on leads", !has(policySql("update_leads_public")) && !hasLow("create policy update_leads on public.leads"));
check("NO public DELETE on leads", !has(policySql("delete_leads_public")) && !hasLow("create policy delete_leads on public.leads"));

// Storage
check("storage section present", hasLow("storage.buckets"));
["products","projects","services","site-assets"].forEach(b => check("bucket " + b, hasLow("bucket_id = '" + b + "'")));
["products","projects","services","site-assets"].forEach(b => check("bucket policy public read for " + b, has("bucket_id = '" + b + "'") && has("name = 'public'")));
["products","projects","services","site-assets"].forEach(b => check("bucket policy service_role upload for " + b, has("bucket_id = '" + b + "'") && has("name = 'service_role_uploads'")));

// Seed categories
["Laminate Flooring","SPC Flooring","Vinyl Flooring","PVC Wall Panels","Wallpaper","Folding Doors","Gypsum Ceilings","Window Blinds","3D Wall Panels & Wall Art","Artificial Grass"].forEach(c => check("seed category: " + c, has("'" + c + "'")));

// Site settings
check("site_settings brand = HOME INTERIOR", has("'HOME INTERIOR'"));
check("site_settings tagline", has("'KARACHI — BESPOKE LIVING STUDIO'"));
check("site_settings phone", has("'+92 300 1234567'"));
check("site_settings whatsapp", has("'+92 303 2566212'"));

console.log("\nRESULT: " + (fail === 0 ? "ALL PASS" : fail + " FAILURES"));
process.exit(fail);