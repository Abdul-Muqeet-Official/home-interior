import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import { getStoredNavigation, saveStoredNavigation } from "@/lib/content/navigation-store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const navigation = getStoredNavigation();
    return NextResponse.json({ navigation });
  } catch (error) {
    console.error("Error fetching navigation:", error);
    return NextResponse.json({ error: "Failed to fetch navigation" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const body = await request.json();
    if (!body || !Array.isArray(body.primary)) {
      return NextResponse.json({ error: "Invalid navigation data" }, { status: 400 });
    }

    const updated = await saveStoredNavigation(body);

    try {
      revalidatePath("/", "layout");
    } catch {
      // ignore
    }

    return NextResponse.json({ navigation: updated });
  } catch (error) {
    console.error("Error updating navigation:", error);
    return NextResponse.json({ error: "Failed to update navigation" }, { status: 500 });
  }
}

