import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import { getStoredOrders, buildWhatsAppOrderMessage } from "@/lib/content/orders-store";
import { SITE } from "@/lib/site.config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const orders = getStoredOrders();
    const phoneDigits = SITE.whatsapp.replace(/\D/g, "");

    const enriched = orders.map((order) => {
      const waMsg = buildWhatsAppOrderMessage(order);
      return {
        ...order,
        whatsappUrl: `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMsg)}`,
      };
    });

    return NextResponse.json({ orders: enriched });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

