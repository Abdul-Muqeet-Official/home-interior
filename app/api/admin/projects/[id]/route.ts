import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminGuard } from "@/lib/supabase/guard";
import { revalidateWork } from "@/lib/supabase/revalidate";

/** Cookie-authorised handlers are always dynamic, never statically prerendered. */
export const dynamic = "force-dynamic";

function requireAdmin() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }
  return supabaseAdmin;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
    const { id } = await params;

    const { data, error } = await admin
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { 
      title, 
      slug, 
      description, 
      location, 
      year, 
      category, 
      images, 
      video_url, 
      video_urls,
      video_poster,
      featured,
      published,
      sort_order 
    } = body;

    const { data, error } = await admin
      .from("projects")
      .update({
        title,
        slug,
        short_description: description,
        description,
        location,
        type: category,
        year,
        hero_image_path: images?.[0] ?? null,
        gallery_paths: images ?? [],
        video_url,
        video_paths: Array.isArray(video_urls) ? video_urls : video_url ? [video_url] : [],
        video_poster_path: video_poster || null,
        is_featured: featured === true,
        is_published: published === true,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidateWork(data.slug);
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
    const { id } = await params;

    const { data, error } = await admin
      .from("projects")
      .delete()
      .eq("id", id)
      .select("slug")
      .maybeSingle();

    if (error) throw error;

    revalidateWork(data?.slug ?? null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
