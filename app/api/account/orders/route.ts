import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { readPublicSupabaseEnv } from "@/lib/supabase/env";
import { getStoredOrders } from "@/lib/content/orders-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const env = readPublicSupabaseEnv();
  if (!env) {
    return NextResponse.json({ orders: [] });
  }

  // Get auth token from Authorization header or cookie
  const authHeader = request.headers.get("authorization");
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "") : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authClient = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Filter orders strictly by user ID or customer email
  const allOrders = getStoredOrders();
  const customerEmail = user.email?.toLowerCase();
  const userOrders = allOrders.filter(
    (order) =>
      order.userId === user.id ||
      (order.customerEmail && order.customerEmail.toLowerCase() === customerEmail)
  );

  return NextResponse.json({ orders: userOrders });
}

