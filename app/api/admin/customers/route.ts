import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStoredOrders } from "@/lib/content/orders-store";

export const dynamic = "force-dynamic";

export interface CustomerRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  orderCount: number;
  lastActive: string;
  source: "auth" | "orders";
}

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const customersMap = new Map<string, CustomerRecord>();

    // 1. Fetch Supabase Auth users if available
    if (supabaseAdmin) {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
        if (authData?.users) {
          authData.users.forEach((u) => {
            const email = u.email || "";
            const key = email.toLowerCase() || u.id;
            const meta = u.user_metadata || {};
            customersMap.set(key, {
              id: u.id,
              name: meta.full_name || meta.fullName || email.split("@")[0] || "Registered Client",
              email: u.email || null,
              phone: meta.phone || "—",
              address: meta.address || null,
              orderCount: 0,
              lastActive: u.last_sign_in_at || u.created_at,
              source: "auth",
            });
          });
        }
      } catch (err) {
        console.warn("[customers-api] Could not list auth users:", err);
      }
    }

    // 2. Fetch orders and link / augment customers
    const orders = getStoredOrders();
    orders.forEach((o) => {
      const emailKey = o.customerEmail ? o.customerEmail.toLowerCase() : null;
      const phoneKey = o.customerPhone ? o.customerPhone.trim() : null;
      const key = emailKey || phoneKey || o.id;

      const existing = customersMap.get(key);
      if (existing) {
        existing.orderCount += 1;
        if (!existing.phone || existing.phone === "—") existing.phone = o.customerPhone;
        if (!existing.address) existing.address = o.deliveryAddress;
        if (new Date(o.createdAt) > new Date(existing.lastActive)) {
          existing.lastActive = o.createdAt;
        }
      } else {
        customersMap.set(key, {
          id: o.userId || `ord_cust_${o.id}`,
          name: o.customerName,
          email: o.customerEmail,
          phone: o.customerPhone,
          address: o.deliveryAddress,
          orderCount: 1,
          lastActive: o.createdAt,
          source: "orders",
        });
      }
    });

    const customers = Array.from(customersMap.values()).sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

