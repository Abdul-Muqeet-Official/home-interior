"use client";

import { useEffect, useState } from "react";
import { OrderRecord, OrderStatus } from "@/lib/content/orders-store";

const STATUSES: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "whatsapp_pending", label: "Pending" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<(OrderRecord & { whatsappUrl?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading orders");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: data.order.status } : o))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setSavingId(null);
    }
  }

  async function handleSaveNotes(orderId: string) {
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (!res.ok) throw new Error("Failed to update notes");
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, notes: data.order.notes } : o))
      );
      setEditingNotesId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating notes");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(orderId: string, orderNumber: string) {
    if (!confirm(`Are you sure you want to permanently delete order ${orderNumber}?`)) return;
    setSavingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting order");
    } finally {
      setSavingId(null);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "all" || order.status === activeTab;
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      order.orderNumber.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.customerPhone.toLowerCase().includes(term) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(term));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Studio Procurement</span>
            <span className="text-muted">/</span>
            <span className="text-xs uppercase tracking-wider text-muted">Orders & Enquiries</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl lg:text-3xl text-charcoal">
            Customer Orders & Quotations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage incoming WhatsApp order requests, customer details, and procurement status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search ref, client, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-xs text-charcoal outline-none focus:border-champagne"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-line pb-2">
        {STATUSES.map((tab) => {
          const count =
            tab.value === "all"
              ? orders.length
              : orders.filter((o) => o.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs transition uppercase tracking-wider ${
                activeTab === tab.value
                  ? "bg-charcoal text-white font-medium"
                  : "bg-surface text-muted hover:text-charcoal border border-line"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-card border border-line bg-surface p-12 text-center text-xs text-muted">
          Loading orders…
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-12 text-center text-xs text-muted">
          No orders found matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-card border border-line bg-surface p-6 transition hover:border-sand"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-charcoal">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="font-medium text-charcoal">{order.customerName}</span>
                    <span>&bull;</span>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="hover:underline hover:text-charcoal"
                    >
                      {order.customerPhone}
                    </a>
                    {order.customerEmail && (
                      <>
                        <span>&bull;</span>
                        <a
                          href={`mailto:${order.customerEmail}`}
                          className="hover:underline hover:text-charcoal"
                        >
                          {order.customerEmail}
                        </a>
                      </>
                    )}
                  </div>
                  {order.deliveryAddress && (
                    <p className="mt-1 text-xs text-muted/80">
                      <span className="font-medium text-charcoal">Address:</span>{" "}
                      {order.deliveryAddress}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    disabled={savingId === order.id}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-charcoal font-medium outline-none focus:border-champagne"
                  >
                    <option value="draft">Draft</option>
                    <option value="whatsapp_pending">WhatsApp Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {order.whatsappUrl && (
                    <a
                      href={order.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      WhatsApp
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(order.id, order.orderNumber)}
                    disabled={savingId === order.id}
                    className="rounded border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition"
                    title="Delete order record"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line/40 text-muted uppercase text-[10px]">
                      <th className="pb-1.5">Item</th>
                      <th className="pb-1.5">Dimensions</th>
                      <th className="pb-1.5 text-center">Qty</th>
                      <th className="pb-1.5 text-right">Unit Price</th>
                      <th className="pb-1.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="py-2">
                        <td className="py-2 font-medium text-charcoal">
                          {item.name}{" "}
                          <span className="text-muted font-normal">({item.category})</span>
                        </td>
                        <td className="py-2 text-muted">{item.dimensions || "—"}</td>
                        <td className="py-2 text-center text-charcoal">{item.quantity}</td>
                        <td className="py-2 text-right text-muted">
                          {item.unitPrice
                            ? `PKR ${item.unitPrice.toLocaleString()}`
                            : item.priceLabel || "Consultation"}
                        </td>
                        <td className="py-2 text-right font-medium text-charcoal">
                          {item.subtotal
                            ? `PKR ${item.subtotal.toLocaleString()}`
                            : "On consultation"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer / Notes */}
              <div className="mt-4 pt-4 border-t border-line/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs w-full sm:max-w-xl">
                  {editingNotesId === order.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Internal studio notes…"
                        className="w-full rounded border border-line px-3 py-1.5 text-xs text-charcoal outline-none focus:border-champagne"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveNotes(order.id)}
                        disabled={savingId === order.id}
                        className="rounded bg-charcoal px-3 py-1.5 text-xs text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="text-xs text-muted hover:text-charcoal"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted">
                      <span>Notes:</span>
                      <span className="italic text-charcoal">
                        {order.notes || "None"}
                      </span>
                      <button
                        onClick={() => {
                          setEditingNotesId(order.id);
                          setNotesValue(order.notes || "");
                        }}
                        className="text-[11px] underline hover:text-charcoal ml-2"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider text-muted">Total: </span>
                  <span className="font-serif text-base font-semibold text-charcoal">
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

