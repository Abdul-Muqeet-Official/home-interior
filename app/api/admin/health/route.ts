import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const envCheck = {
      supabaseUrl: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      adminEmails: !!process.env.ADMIN_EMAILS,
    };

    let dbOk = false;
    let tables: Record<string, number | null> = {};
    let storageBuckets: string[] = [];

    if (supabaseAdmin) {
      try {
        const [categories, products, media, projects, reviews] = await Promise.all([
          supabaseAdmin.from("categories").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("media").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
          supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }),
        ]);

        tables = {
          categories: categories.count,
          products: products.count,
          media: media.count,
          projects: projects.count,
          reviews: reviews.count,
        };
        dbOk = true;

        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        if (buckets) {
          storageBuckets = buckets.map((b) => b.name);
        }
      } catch (err) {
        console.error("Health check DB probe failed:", err);
      }
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbOk,
        tables,
      },
      storage: {
        buckets: storageBuckets,
      },
      environment: envCheck,
      system: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ error: "System health probe failed" }, { status: 500 });
  }
}

