"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/site.config";
import { cx } from "@/lib/utils";

interface NavGroup {
  group: string;
  items: {
    href: string;
    label: string;
    icon: (props: { className?: string }) => JSX.Element;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { href: "/admin", label: "Executive Dashboard", icon: DashboardIcon },
    ],
  },
  {
    group: "CATALOGUE & ASSETS",
    items: [
      { href: "/admin/products", label: "Products", icon: PackageIcon },
      { href: "/admin/categories", label: "Categories", icon: GridIcon },
      { href: "/admin/collections", label: "Collections & Series", icon: LayersIcon },
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
    ],
  },
  {
    group: "COMMERCE & CLIENTS",
    items: [
      { href: "/admin/orders", label: "Client Orders", icon: ShoppingCartIcon, badge: "Live" },
      { href: "/admin/customers", label: "Client Registry", icon: UsersIcon },
    ],
  },
  {
    group: "PORTFOLIO & REVIEWS",
    items: [
      { href: "/admin/projects", label: "Our Work (Projects)", icon: FolderIcon },
      { href: "/admin/reviews", label: "Client Reviews", icon: StarIcon },
    ],
  },
  {
    group: "STUDIO SYSTEM",
    items: [
      { href: "/admin/settings", label: "Studio Settings", icon: SettingsIcon },
      { href: "/admin/health", label: "System Health", icon: ShieldCheckIcon },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      // Fallback
    }
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-sans text-charcoal">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Ultra-VIP Architectural Executive Look */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-[#242220] bg-[#121110] text-[#E7E3DC] transition-transform duration-300 ease-editorial lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* Top Studio Brand Plate */}
            <div className="border-b border-[#23211E] px-6 py-5">
              <div className="flex items-center justify-between">
                <Link href="/admin" className="block group">
                  <span className="font-serif text-xl tracking-[0.24em] text-white group-hover:text-[#C5A880] transition-colors">
                    {SITE.name}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C5A880] animate-pulse" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#C5A880]">
                      VIP Control Center
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="overflow-y-auto px-4 py-5 max-h-[calc(100vh-175px)] space-y-6" aria-label="Admin sections">
              {NAV_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#78746D]">
                    {group.group}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === "/admin"
                          ? pathname === "/admin"
                          : pathname.startsWith(item.href);

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cx(
                              "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
                              isActive
                                ? "bg-[#C5A880] text-[#121214] font-semibold shadow-[0_2px_12px_rgba(197,168,128,0.25)]"
                                : "text-[#A9A49B] hover:bg-[#1E1C1A] hover:text-white"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                className={cx(
                                  "h-4 w-4 shrink-0 transition-colors",
                                  isActive ? "text-[#121214]" : "text-[#78746D]"
                                )}
                              />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && !isActive && (
                              <span className="rounded-full bg-[#23211E] px-2 py-0.5 text-[9px] font-mono text-[#C5A880] border border-[#38342E]">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Administrator Profile Card */}
          <div className="border-t border-[#23211E] bg-[#0E0D0C] p-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#23211E] bg-[#161514] p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C5A880]/15 border border-[#C5A880]/30 text-xs font-bold text-[#C5A880]">
                  SR
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    Suleman Rashid
                  </p>
                  <p className="flex items-center gap-1.5 text-[10px] text-[#8E8A83]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Studio Owner (Admin)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg p-1.5 text-[#8E8A83] transition-colors hover:bg-red-950/40 hover:text-red-400"
                title="Sign out of control center"
              >
                <LogOutIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-[#78746D]">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#C5A880] transition-colors"
              >
                <ExternalLinkIcon className="h-3 w-3" />
                <span>View Live Site</span>
              </Link>
              <a
                href="https://wa.me/923032566212"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C5A880] transition-colors"
              >
                WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-pure/90 px-6 backdrop-blur-md lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-surface transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            {/* Breadcrumb / Location */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-serif tracking-wider text-muted hidden sm:inline">
                HOME INTERIOR
              </span>
              <span className="text-muted/40 hidden sm:inline">/</span>
              <span className="font-semibold text-charcoal capitalize">
                {pathname === "/admin"
                  ? "Executive Overview"
                  : pathname.replace("/admin/", "").replace("-", " ")}
              </span>
            </div>
          </div>

          {/* Quick Actions & Live Status */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Synchronized Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Studio Engine Live</span>
            </div>

            {/* Quick Add Product Button */}
            <Link
              href="/admin/products/new"
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:border-champagne hover:text-champagne"
            >
              <span>+ Add Product</span>
            </Link>

            {/* View Live Store */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-black"
            >
              <span>View Store</span>
              <ExternalLinkIcon className="h-3.5 w-3.5 text-champagne" />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-6 py-8 lg:px-10 max-w-7xl w-full mx-auto" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

// Minimalist Luxury SVGs
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" strokeWidth={1.5} />
      <rect x="14" y="3" width="7" height="5" rx="1.5" strokeWidth={1.5} />
      <rect x="14" y="12" width="7" height="9" rx="1.5" strokeWidth={1.5} />
      <rect x="3" y="16" width="7" height="5" rx="1.5" strokeWidth={1.5} />
    </svg>
  );
}

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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 21v-2a4 4 0 00-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
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

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 17" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}