import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminGuard } from "@/lib/supabase/guard";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

function requireAdmin() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }
  return supabaseAdmin;
}

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
    const { data, error } = await admin
      .from("settings")
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
    const body = await request.json();
    const { 
      site_name, 
      site_description, 
      phone, 
      whatsapp, 
      email, 
      address, 
      instagram, 
      facebook, 
      linkedin, 
      seo_title, 
      seo_description, 
      seo_image 
    } = body;

    const { data, error } = await admin
      .from("settings")
      .upsert({
        id: "1",
        site_name,
        site_description,
        phone,
        whatsapp,
        email,
        address,
        instagram,
        facebook,
        linkedin,
        seo_title,
        seo_description,
        seo_image,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
