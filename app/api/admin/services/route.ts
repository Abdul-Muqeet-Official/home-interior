import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import { getStoredServices, saveStoredServices } from "@/lib/content/services-store";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const services = getStoredServices();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const body = await request.json();
    if (!Array.isArray(body.services)) {
      return NextResponse.json({ error: "services array is required" }, { status: 400 });
    }

    const updated = await saveStoredServices(body.services);

    try {
      revalidatePath("/services");
      revalidatePath("/");
    } catch {
      // ignore
    }

    return NextResponse.json({ services: updated });
  } catch (error) {
    console.error("Error updating services:", error);
    return NextResponse.json({ error: "Failed to update services" }, { status: 500 });
  }
}

