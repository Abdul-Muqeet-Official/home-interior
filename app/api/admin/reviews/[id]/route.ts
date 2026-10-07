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
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review: data });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
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
    const { client_name, email, testimonial, rating, location, project_type, is_published, sort_order } = body;

    if (!client_name || !email || !testimonial || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("reviews")
      .update({
        client_name,
        email,
        testimonial,
        rating,
        location,
        project_type,
        is_published: is_published === true,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidateReviews();
    return NextResponse.json({ review: data });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
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

    const { error } = await admin
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidateReviews();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
