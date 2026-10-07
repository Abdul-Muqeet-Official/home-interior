import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminGuard } from "@/lib/supabase/guard";
import { revalidateReviews } from "@/lib/supabase/revalidate";

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
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reviews: data });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const admin = requireAdmin();
    const body = await request.json();
    const { client_name, email, testimonial, rating, location, project_type, is_published, sort_order } = body;

    if (!client_name || !email || !testimonial || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("reviews")
      .insert({
        client_name,
        email,
        testimonial,
        rating,
        location,
        project_type,
        is_published: is_published === true,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    revalidateReviews();
    return NextResponse.json({ review: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
