import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import { getAdminSessionFromRequest } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const currentSession = await getAdminSessionFromRequest(request);
    const allowList = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    return NextResponse.json({
      currentSession,
      allowList,
    });
  } catch (error) {
    console.error("Error fetching access data:", error);
    return NextResponse.json({ error: "Failed to fetch access data" }, { status: 500 });
  }
}

