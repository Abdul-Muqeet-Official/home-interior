import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { readPublicSupabaseEnv } from "@/lib/supabase/env";

const reviewSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  projectType: z.string().min(1, "Project type is required").max(100),
  review: z.string().min(10, "Review must be at least 10 characters").max(1000),
  consent: z.boolean().refine(val => val === true, "You must consent to publish the review"),
});

export async function POST(req: Request) {
  try {
    const env = readPublicSupabaseEnv();
    if (!env) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, projectType, review } = parsed.data;

    // Create a fresh client without the fetch cache override for mutation
    const supabase = createClient(env.url, env.anonKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from("reviews")
      .insert({
        client_name: name,
        project_type: projectType,
        testimonial: review,
        is_published: false,
      });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Review submitted successfully" });
  } catch (err) {
    console.error("Reviews API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
