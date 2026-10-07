"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrderRecord } from "@/lib/content/orders-store";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/account/orders");
        if (!res.ok) {
          throw new Error("Failed to load orders");
        }
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusBadge = (status: OrderRecord["status"]) => {
    switch (status) {
      case "whatsapp_pending":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "contacted":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "confirmed":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "processing":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-stone-100 text-stone-600 border-stone-200";
      default:
        return "bg-sand/40 text-charcoal border-line";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="font-serif text-xl text-charcoal">Order & Quotation History</h2>
          <p className="mt-1 text-xs text-muted">
            Track your bespoke architectural orders, status updates, and WhatsApp dialogues.
          </p>
        </div>
        <Link
          href="/materials"
          className="self-start sm:self-auto rounded-lg bg-charcoal px-4 py-2 text-xs uppercase tracking-widest text-canvas hover:bg-charcoal/90 transition"
        >
          Browse Catalogue
        </Link>
      </div>

      {loading ? (
        <div className="rounded-card border border-line bg-surface p-12 text-center text-xs text-muted">
          Loading order history…
        </div>
      ) : error ? (
        <div className="rounded-card border border-red-200 bg-red-50/70 p-6 text-xs text-red-800">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-12 text-center">
          <p className="font-serif text-lg text-charcoal">No orders on record</p>
          <p className="mt-2 text-xs text-muted max-w-md mx-auto">
            You haven’t submitted any orders or quotations yet. Explore our curated collections to select materials for your residence or commercial space.
          </p>
          <Link
            href="/materials"
            className="mt-6 inline-block rounded-lg bg-charcoal px-6 py-3 text-xs uppercase tracking-widest text-canvas hover:bg-charcoal/90 transition"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-card border border-line bg-surface p-6 sm:p-8 space-y-6"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/70 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-charcoal">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-medium ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {order.whatsappUrl && (
                    <a
                      href={order.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-emerald-700 transition"
                    >
                      <svg
                        className="h-3.5 w-3.5 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.838.835 2.791.835 3.181 0 5.767-2.586 5.767-5.766 0-3.18-2.586-5.766-5.767-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.748 0-3.414-.457-4.87-1.282l-5.13 1.342 1.365-4.992c-.908-1.527-1.365-3.267-1.365-5.068 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                      </svg>
                      Open WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-muted uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Material / Specification</th>
                      <th className="pb-2">Dimensions</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="py-2.5">
                        <td className="py-3">
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-serif text-charcoal hover:underline hover:text-champagne transition font-medium"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[11px] text-muted">{item.category}</p>
                        </td>
                        <td className="py-3 text-muted">{item.dimensions || "—"}</td>
                        <td className="py-3 text-center text-charcoal font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right text-muted">
                          {item.unitPrice
                            ? `PKR ${item.unitPrice.toLocaleString()}`
                            : item.priceLabel || "Consultation"}
                        </td>
                        <td className="py-3 text-right font-medium text-charcoal">
                          {item.subtotal
                            ? `PKR ${item.subtotal.toLocaleString()}`
                            : "On consultation"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Footer */}
              <div className="border-t border-line/70 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div>
                  <p className="text-muted">
                    <span className="font-semibold text-charcoal">Customer:</span>{" "}
                    {order.customerName} ({order.customerPhone})
                  </p>
                  {order.deliveryAddress && (
                    <p className="text-muted mt-0.5">
                      <span className="font-semibold text-charcoal">Address:</span>{" "}
                      {order.deliveryAddress}
                    </p>
                  )}
                  {order.notes && (
                    <p className="text-muted mt-0.5 italic">
                      <span className="font-semibold text-charcoal not-italic">Notes:</span>{" "}
                      &ldquo;{order.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="text-right self-end sm:self-auto">
                  <span className="text-[11px] uppercase tracking-wider text-muted block">
                    Total Estimated Value
                  </span>
                  <span className="font-serif text-lg text-charcoal font-semibold">
                    {order.subtotal ? `PKR ${order.subtotal.toLocaleString()}` : "Price on consultation"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
