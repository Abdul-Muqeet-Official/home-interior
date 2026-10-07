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

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
    const { data, error } = await admin
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ projects: data });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
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

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("projects")
      .insert({
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
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    revalidateWork(data.slug);
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
