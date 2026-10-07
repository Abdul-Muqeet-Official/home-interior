import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProductBySlug } from "@/lib/supabase/queries";
import {
  createOrderRecord,
  buildWhatsAppOrderMessage,
  type OrderItemRecord,
} from "@/lib/content/orders-store";
import { SITE } from "@/lib/site.config";

export const dynamic = "force-dynamic";

const CreateOrderSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(8, "Valid phone number is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  deliveryAddress: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  userId: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string(),
      slug: z.string(),
      quantity: z.number().int().min(1).max(999),
      name: z.string().optional(),
      category: z.string().optional(),
    })
  ).min(1, "At least one item is required in the cart"),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = CreateOrderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      notes,
      userId,
      items: rawItems,
    } = parsed.data;

    // Parallel server-side validation of ordered items
    const fetchedProducts = await Promise.all(
      rawItems.map((raw) => getProductBySlug(raw.slug))
    );

    const orderItems: OrderItemRecord[] = [];
    let serverSubtotal = 0;

    for (let i = 0; i < rawItems.length; i++) {
      const raw = rawItems[i];
      const product = fetchedProducts[i];

      if (product) {
        if (product.stockStatus === "out_of_stock") {
          return NextResponse.json(
            {
              error: `Product "${product.name}" is currently out of stock and cannot be ordered.`,
            },
            { status: 400 }
          );
        }

        const unitPrice = typeof product.price === "number" && product.price > 0 ? product.price : null;
        const lineTotal = unitPrice ? unitPrice * raw.quantity : null;
        if (lineTotal) serverSubtotal += lineTotal;

        orderItems.push({
          productId: raw.productId,
          slug: product.slug,
          name: product.name,
          category: product.categoryName,
          quantity: raw.quantity,
          unitPrice,
          subtotal: lineTotal,
          dimensions: product.dimensions
            ? `${product.dimensions.length || ""}x${product.dimensions.width || ""} ${product.dimensions.unit || ""}`.trim()
            : null,
          priceLabel: product.priceLabel ?? "Price on consultation",
          availability: product.stockStatus ? product.stockStatus.replace("_", " ").toUpperCase() : "In Stock",
        });
      } else {
        orderItems.push({
          productId: raw.productId,
          slug: raw.slug,
          name: raw.name ?? "Custom Product",
          category: raw.category ?? "Material Finish",
          quantity: raw.quantity,
          unitPrice: null,
          subtotal: null,
          priceLabel: "Price on consultation",
          availability: "On Consultation",
        });
      }
    }

    const order = await createOrderRecord({
      userId: userId || null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      deliveryAddress: deliveryAddress || null,
      notes: notes || null,
      items: orderItems,
      subtotal: serverSubtotal,
      total: serverSubtotal,
    });

    const whatsappMessage = buildWhatsAppOrderMessage(order);
    const whatsappUrl = `https://wa.me/923032566212?text=${encodeURIComponent(whatsappMessage)}`;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      whatsappUrl,
    });
  } catch (error) {
    console.error("[api/orders] Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order record. Please try again." },
      { status: 500 }
    );
  }
}
