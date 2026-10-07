import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/supabase/guard";
import {
  updateOrderStatus,
  updateOrderNotes,
  deleteOrderRecord,
  OrderStatus,
} from "@/lib/content/orders-store";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { status, notes } = body;

    let updatedOrder = null;

    if (status) {
      updatedOrder = await updateOrderStatus(id, status as OrderStatus);
    }

    if (typeof notes === "string") {
      updatedOrder = await updateOrderNotes(id, notes);
    }

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("Error updating admin order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const denied = await adminGuard(request);
    if (denied) return denied;

    const { id } = params;
    const success = await deleteOrderRecord(id);

    if (!success) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

