import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site.config";

export type OrderStatus =
  | "draft"
  | "whatsapp_pending"
  | "contacted"
  | "confirmed"
  | "processing"
  | "completed"
  | "cancelled";

export interface OrderItemRecord {
  productId: string;
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number | null;
  subtotal: number | null;
  dimensions?: string | null;
  priceLabel?: string | null;
  availability?: string | null;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  items: OrderItemRecord[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  whatsappUrl?: string;
}

const ORDERS_FILE = path.join(process.cwd(), "lib", "content", "orders_store.json");

export function getStoredOrders(): OrderRecord[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[orders-store] Failed to read orders file:", err);
  }
  return [];
}

export function saveStoredOrders(orders: OrderRecord[]): void {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("[orders-store] Failed to write orders file:", err);
  }
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `HI-${year}-${random}`;
}

export async function createOrderRecord(params: {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: OrderItemRecord[];
  subtotal: number;
  total: number;
}): Promise<OrderRecord> {
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();

  const newOrder: OrderRecord = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    orderNumber,
    userId: params.userId ?? null,
    customerName: params.customerName.trim(),
    customerPhone: params.customerPhone.trim(),
    customerEmail: params.customerEmail ? params.customerEmail.trim() : null,
    deliveryAddress: params.deliveryAddress ? params.deliveryAddress.trim() : null,
    notes: params.notes ? params.notes.trim() : null,
    items: params.items,
    subtotal: params.subtotal,
    total: params.total,
    status: "whatsapp_pending",
    createdAt: now,
    updatedAt: now,
  };

  const current = getStoredOrders();
  saveStoredOrders([newOrder, ...current]);

  // Best effort sync with Supabase if orders table exists
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("orders").insert({
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        user_id: newOrder.userId,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_email: newOrder.customerEmail,
        delivery_address: newOrder.deliveryAddress,
        notes: newOrder.notes,
        subtotal: newOrder.subtotal,
        total: newOrder.total,
        status: newOrder.status,
        created_at: newOrder.createdAt,
      });
    } catch {
      // Non-blocking
    }
  }

  return newOrder;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderRecord | null> {
  const current = getStoredOrders();
  const orderIndex = current.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
  if (orderIndex === -1) return null;

  current[orderIndex].status = status;
  current[orderIndex].updatedAt = new Date().toISOString();
  saveStoredOrders(current);

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("orders").update({ status }).eq("id", current[orderIndex].id);
    } catch {
      // Non-blocking
    }
  }

  return current[orderIndex];
}

export async function updateOrderNotes(orderId: string, notes: string): Promise<OrderRecord | null> {
  const current = getStoredOrders();
  const orderIndex = current.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
  if (orderIndex === -1) return null;

  current[orderIndex].notes = notes.trim();
  current[orderIndex].updatedAt = new Date().toISOString();
  saveStoredOrders(current);

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("orders").update({ notes }).eq("id", current[orderIndex].id);
    } catch {
      // Non-blocking
    }
  }

  return current[orderIndex];
}

export async function deleteOrderRecord(orderId: string): Promise<boolean> {
  const current = getStoredOrders();
  const filtered = current.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
  if (filtered.length === current.length) return false;
  saveStoredOrders(filtered);

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("orders").delete().eq("id", orderId);
    } catch {
      // Non-blocking
    }
  }

  return true;
}

export function buildWhatsAppOrderMessage(order: OrderRecord): string {
  const lines: string[] = [
    `*HOME INTERIOR — PRODUCT ORDER*`,
    ``,
    `*Order Ref:* ${order.orderNumber}`,
    `*Customer:* ${order.customerName}`,
    `*Phone:* ${order.customerPhone}`,
  ];

  if (order.customerEmail) {
    lines.push(`*Email:* ${order.customerEmail}`);
  }

  if (order.deliveryAddress) {
    lines.push(`*Delivery Address:* ${order.deliveryAddress}`);
  }

  lines.push(``, `*Items:*`);

  order.items.forEach((item, index) => {
    lines.push(`${index + 1}. *${item.name}*`);
    lines.push(`   Category: ${item.category}`);
    lines.push(`   Quantity: ${item.quantity}`);
    if (item.unitPrice && item.unitPrice > 0) {
      lines.push(`   Unit Price: PKR ${item.unitPrice.toLocaleString()}`);
    } else {
      lines.push(`   Price: Available on consultation`);
    }
    if (item.dimensions) {
      lines.push(`   Dimensions: ${item.dimensions}`);
    }
    if (item.availability) {
      lines.push(`   Availability: ${item.availability}`);
    }
    lines.push(``);
  });

  if (order.subtotal > 0) {
    lines.push(`*Estimated Total:* PKR ${order.subtotal.toLocaleString()}`);
  } else {
    lines.push(`*Total:* Confirmed upon quotation & consultation`);
  }

  lines.push(`*Delivery & Installation:* To be confirmed by studio`);

  if (order.notes) {
    lines.push(``, `*Notes:* ${order.notes}`);
  }

  return lines.join("\n");
}
