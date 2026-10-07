"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { OrderRecord } from "@/lib/content/orders-store";

export default function AccountDashboardPage() {
  const { user, profile } = useAuth();
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/account/orders");
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.orders?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error("Failed to load account orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    if (user) {
      loadOrders();
    }
  }, [user]);

  return (
    <div className="space-y-10">
      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-card border border-line bg-surface p-6">
          <p className="eyebrow">Client Record</p>
          <h2 className="mt-2 font-serif text-xl text-charcoal">{profile?.fullName || "Valued Client"}</h2>
          <div className="mt-4 space-y-1 text-xs text-muted">
            <p className="truncate">{user?.email}</p>
            <p>{profile?.phone || "No phone number saved"}</p>
            <p className="line-clamp-2">{profile?.address || "No delivery address saved"}</p>
          </div>
          <Link
            href="/account/profile"
            className="mt-5 inline-block text-xs uppercase tracking-widest text-charcoal underline underline-offset-4 hover:text-champagne transition"
          >
            Edit Profile &rarr;
          </Link>
        </div>

        <div className="rounded-card border border-line bg-surface p-6">
          <p className="eyebrow">Active Orders & Enquiries</p>
          <h2 className="mt-2 font-serif text-xl text-charcoal">
            {loadingOrders ? "…" : `${recentOrders.length} Recent`}
          </h2>
          <p className="mt-4 text-xs text-muted leading-relaxed">
            All your requested floorings, wall panels, and bespoke surfaces with official order IDs and WhatsApp status.
          </p>
          <Link
            href="/account/orders"
            className="mt-5 inline-block text-xs uppercase tracking-widest text-charcoal underline underline-offset-4 hover:text-champagne transition"
          >
            View All Orders &rarr;
          </Link>
        </div>

        <div className="rounded-card border border-line bg-surface p-6">
          <p className="eyebrow">DHA Studio Concierge</p>
          <h2 className="mt-2 font-serif text-xl text-charcoal">Direct Consultation</h2>
          <p className="mt-4 text-xs text-muted leading-relaxed">
            Immediate assistance with measurements, site visits, or tailored price quotations via our dedicated hotline.
          </p>
          <a
            href="https://wa.me/923032566212?text=Hello%20Home%20Interior%20Karachi,%20I%20would%20like%20to%20consult%20with%20an%20architectural%20specialist."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block text-xs uppercase tracking-widest text-emerald-800 font-semibold underline underline-offset-4 hover:text-emerald-950 transition"
          >
            WhatsApp 0303 2566212 &rarr;
          </a>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="font-serif text-xl text-charcoal">Recent Activity</h2>
            <p className="mt-1 text-xs text-muted">Latest procurement & quotation requests</p>
          </div>
          <Link
            href="/account/orders"
            className="text-xs uppercase tracking-widest text-charcoal hover:text-champagne transition underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        {loadingOrders ? (
          <div className="py-12 text-center text-xs text-muted">Loading your activity…</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-charcoal font-serif">No orders placed yet</p>
            <p className="mt-1 text-xs text-muted">
              Explore our architectural catalogue to assemble materials and place a WhatsApp enquiry.
            </p>
            <Link
              href="/materials"
              className="mt-5 inline-block rounded-lg bg-charcoal px-5 py-2.5 text-xs uppercase tracking-widest text-canvas hover:bg-charcoal/90 transition"
            >
              Explore Materials
            </Link>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-line/60">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-charcoal">{order.orderNumber}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sand/40 border border-line text-charcoal">
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {order.items.length} item(s) &bull; Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="mt-0.5 text-xs text-charcoal/80 font-serif">
                    {order.items.map((i) => i.name).join(", ")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-serif text-charcoal">
                    {order.subtotal ? `PKR ${order.subtotal.toLocaleString()}` : "Quotation on consultation"}
                  </span>
                  {order.whatsappUrl && (
                    <a
                      href={order.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-line px-3 py-1.5 text-[11px] uppercase tracking-wider text-charcoal hover:border-champagne transition"
                    >
                      WhatsApp Message
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Studio Location Card */}
      <div className="rounded-card border border-line bg-surface/50 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <p className="eyebrow">Studio & Experience Showroom</p>
          <h2 className="mt-1 font-serif text-lg text-charcoal">HOME INTERIOR Karachi</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted max-w-lg">
            Building 45C, Shop 1, Lane 11, Near Kababjees, Badar Commercial, DHA Phase 5, Karachi.
            <br />
            Telephone: 0323 2655111 &bull; WhatsApp: 0303 2566212
          </p>
        </div>

        <Link
          href="/consultation"
          className="whitespace-nowrap rounded-lg border border-line bg-canvas px-4 py-2.5 text-xs uppercase tracking-widest text-charcoal hover:border-champagne transition"
        >
          Book Studio Visit
        </Link>
      </div>
    </div>
  );
}

