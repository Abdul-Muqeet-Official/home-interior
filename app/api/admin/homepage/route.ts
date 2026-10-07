import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import {
  getStoredHomepageSettings,
  saveStoredHomepageSettings,
} from "@/lib/content/homepage-store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const homepage = getStoredHomepageSettings();
    return NextResponse.json({ homepage });
  } catch (error) {
    console.error("Error fetching homepage settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const body = await request.json();
    const updated = await saveStoredHomepageSettings(body);

    try {
      revalidatePath("/", "page");
    } catch {
      // ignore
    }

    return NextResponse.json({ homepage: updated });
  } catch (error) {
    console.error("Error updating homepage settings:", error);
    return NextResponse.json(
      { error: "Failed to update homepage settings" },
      { status: 500 }
    );
  }
}

