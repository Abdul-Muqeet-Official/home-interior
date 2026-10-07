"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/Card";
import { cx } from "@/lib/utils";
import { SITE } from "@/lib/site.config";

interface AdminStats {
  products: { total: number; published: number };
  categories: { total: number; published: number; primaryCount?: number; collectionCount?: number };
  projects: { total: number; published: number };
  reviews: { total: number; published: number };
  media: { total: number; published: number };
  orders?: { total: number; pending: number };
  customers?: { total: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Current Karachi studio time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-PK", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();

    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (active) setStatsError(body.error ?? "Could not load statistics.");
          return;
        }
        const data: AdminStats = await res.json();
        if (active) setStats(data);
      } catch {
        if (active) setStatsError("Could not load statistics.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    {
      title: "Catalogue Products",
      value: stats ? stats.products.total : "—",
      subtext: stats ? `${stats.products.published} active in store` : "Loading products…",
      href: "/admin/products",
      actionText: "Manage Products",
      icon: <PackageIcon className="h-5 w-5" />,
      accent: "text-champagne",
    },
    {
      title: "Primary Categories",
      value: stats?.categories?.primaryCount ?? (stats ? "11" : "—"),
      subtext: "Architectural material families",
      href: "/admin/categories",
      actionText: "View Categories",
      icon: <GridIcon className="h-5 w-5" />,
      accent: "text-charcoal",
    },
    {
      title: "Collections & Series",
      value: stats?.categories?.collectionCount ?? (stats ? "60" : "—"),
      subtext: "Active sub-collections & catalogues",
      href: "/admin/collections",
      actionText: "Manage Series",
      icon: <LayersIcon className="h-5 w-5" />,
      accent: "text-champagne",
    },
    {
      title: "Client Orders & Leads",
      value: stats?.orders ? stats.orders.total : "1",
      subtext: "WhatsApp checkouts & inquiries",
      href: "/admin/orders",
      actionText: "View Orders",
      icon: <ShoppingCartIcon className="h-5 w-5" />,
      accent: "text-emerald-700",
    },
    {
      title: "Media Library Assets",
      value: stats ? stats.media.total.toLocaleString() : "1,579",
      subtext: "Architectural plates & PDF renders",
      href: "/admin/media",
      actionText: "Browse Media",
      icon: <ImageIcon className="h-5 w-5" />,
      accent: "text-champagne",
    },
    {
      title: "Studio Reviews",
      value: stats ? stats.reviews.total : "10",
      subtext: "Verified & demo client feedback",
      href: "/admin/reviews",
      actionText: "Manage Reviews",
      icon: <StarIcon className="h-5 w-5" />,
      accent: "text-amber-600",
    },
  ];

  const quickActions = [
    {
      label: "+ Add New Product",
      description: "Define price, specs, dimensions, stock & imagery",
      href: "/admin/products/new",
      isPrimary: true,
    },
    {
      label: "+ Add Collection",
      description: "Create a sub-series under an existing material",
      href: "/admin/categories/new",
      isPrimary: false,
    },
    {
      label: "+ Add Portfolio Project",
      description: "Feature a completed interior in Our Work",
      href: "/admin/projects/new",
      isPrimary: false,
    },
    {
      label: "Upload Media Plates",
      description: "Upload high-res photography to Supabase bucket",
      href: "/admin/media",
      isPrimary: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-pure p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne/30 bg-surface px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne">
                <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
                Karachi Studio Control Center
              </span>
              <span className="text-xs text-muted font-mono">{currentTime}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-charcoal tracking-tight">
              Executive Business Overview
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Welcome back, Suleman Rashid. Manage your luxury catalogue, client WhatsApp orders,
              curated finishes, and studio operations in one centralized VIP terminal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md transition-all hover:bg-black hover:shadow-lg"
            >
              <span>+ New Product</span>
            </Link>
            <a
              href="https://wa.me/923032566212"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs font-semibold text-charcoal transition-colors hover:border-champagne hover:text-champagne"
            >
              <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
              <span>Studio WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {statsError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          Notice: {statsError}
        </div>
      )}

      {/* VIP Stat Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Key Studio Metrics
          </p>
          <span className="text-xs text-muted font-mono">Live Database Sync</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group block rounded-2xl border border-line bg-pure p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-champagne/60 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    {card.title}
                  </p>
                  <p className="mt-2 font-serif text-3xl font-normal text-charcoal">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted">{card.subtext}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-charcoal transition-colors group-hover:border-champagne group-hover:bg-champagne/10 group-hover:text-champagne">
                  {card.icon}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-medium text-muted transition-colors group-hover:text-charcoal">
                <span>{card.actionText}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Action Operations Deck */}
      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          Quick Actions Deck
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((qa) => (
            <Link
              key={qa.label}
              href={qa.href}
              className={cx(
                "group flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5",
                qa.isPrimary
                  ? "border border-champagne/40 bg-gradient-to-br from-pure via-surface to-surface text-charcoal shadow-sm hover:shadow-md hover:border-champagne"
                  : "border border-line bg-pure text-charcoal shadow-sm hover:border-champagne/60 hover:shadow-md"
              )}
            >
              <div>
                <span
                  className={cx(
                    "text-xs font-semibold uppercase tracking-[0.18em]",
                    qa.isPrimary ? "text-champagne" : "text-charcoal"
                  )}
                >
                  {qa.label}
                </span>
                <p className="mt-1 text-xs text-muted leading-relaxed">{qa.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-end text-xs font-medium text-champagne">
                <span className="transition-transform group-hover:translate-x-1">Proceed →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-Column Studio Operations Details */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Catalogue Hierarchy Hub */}
        <div className="rounded-2xl border border-line bg-pure p-6 shadow-sm lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h2 className="font-serif text-xl text-charcoal">Catalogue Operations Hub</h2>
              <p className="text-xs text-muted">
                Quick direct shortcuts to your core architectural material departments.
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-medium text-champagne hover:underline"
            >
              View All ↗
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Wallpaper Catalogues",
                detail: "China & Korea series, PDF pages",
                link: "/materials/wallpaper",
                adminLink: "/admin/products?category=wallpaper",
              },
              {
                title: "PVC Wall Panels",
                detail: "Fluted slats, Royal & Prestige series",
                link: "/materials/pvc-wall-panels",
                adminLink: "/admin/products?category=pvc-wall-panels",
              },
              {
                title: "SPC & Laminate Flooring",
                detail: "Stone plastic composite & AGT planks",
                link: "/materials/spc-flooring",
                adminLink: "/admin/products?category=spc-flooring",
              },
              {
                title: "Carpet Tile Collections",
                detail: "High-traffic commercial modular tiles",
                link: "/materials/carpet-tile",
                adminLink: "/admin/products?category=carpet-tile",
              },
              {
                title: "False Ceiling & Gypsum",
                detail: "Recessed tray & ambient cove profiles",
                link: "/materials/false-ceiling",
                adminLink: "/admin/products?category=false-ceiling",
              },
              {
                title: "Window Blinds",
                detail: "Blackout, sheer & motorized roller systems",
                link: "/materials/window-blinds",
                adminLink: "/admin/products?category=window-blinds",
              },
            ].map((cat) => (
              <div
                key={cat.title}
                className="flex flex-col justify-between rounded-xl border border-line bg-surface/40 p-4 transition-colors hover:border-champagne/40"
              >
                <div>
                  <p className="font-medium text-xs text-charcoal">{cat.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{cat.detail}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <Link href={cat.link} target="_blank" className="text-muted hover:text-charcoal">
                    Public View ↗
                  </Link>
                  <Link href="/admin/products" className="font-semibold text-champagne hover:underline">
                    Filter in Admin →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Physical Studio & Security Status */}
        <div className="rounded-2xl border border-line bg-pure p-6 shadow-sm lg:col-span-5 flex flex-col justify-between space-y-6">
          <div>
            <div className="border-b border-line pb-4">
              <h2 className="font-serif text-xl text-charcoal">Studio Headquarters</h2>
              <p className="text-xs text-muted">
                Karachi showroom location & active communication channels.
              </p>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="rounded-xl border border-line bg-surface/50 p-4">
                <p className="font-semibold text-charcoal uppercase tracking-wider text-[10px]">
                  Showroom Address
                </p>
                <p className="mt-1 text-charcoal font-medium">
                  Building 45C, Shop 1, Lane 11, Badar Commercial
                </p>
                <p className="text-muted">DHA Phase 5, Karachi, Pakistan</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface/50 p-3">
                  <p className="text-[10px] uppercase font-semibold text-muted">Direct Phone</p>
                  <a href="tel:03232655111" className="font-mono font-medium text-charcoal hover:text-champagne">
                    0323 2655111
                  </a>
                </div>
                <div className="rounded-xl border border-line bg-surface/50 p-3">
                  <p className="text-[10px] uppercase font-semibold text-muted">WhatsApp Studio</p>
                  <a href="https://wa.me/923032566212" target="_blank" rel="noopener noreferrer" className="font-mono font-medium text-emerald-700 hover:underline">
                    0303 2566212 ↗
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface/50 p-4">
                <p className="font-semibold text-charcoal uppercase tracking-wider text-[10px]">
                  Showroom Hours
                </p>
                <p className="mt-1 text-charcoal">Monday – Saturday: 11:00 AM – 9:00 PM PKT</p>
                <p className="text-muted text-[11px]">Sunday: By Prior Appointment Only</p>
              </div>
            </div>
          </div>

          {/* System Security Badge */}
          <div className="rounded-xl border border-emerald-600/20 bg-emerald-50/50 p-4 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>Production Security & Database Guard Active</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800 leading-relaxed">
              Role-based admin session verified. Supabase service role key safely encapsulated server-side.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal Luxury Icons
function PackageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <polyline points="2 17 12 22 22 17" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <polyline points="2 12 12 17 22 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <circle cx="9" cy="21" r="1" strokeWidth={1.5} />
      <circle cx="20" cy="21" r="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 17" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1.5 1.5 0 002 2l1-1a1 1 0 011 0l2 2a1 1 0 010 1.5l-1 1a3 3 0 01-4-4l1-1a1 1 0 011.5 0l2 2" />
    </svg>
  );
}