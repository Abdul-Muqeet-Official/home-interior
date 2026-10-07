"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || !user) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-canvas px-6 py-24">
        <div className="text-center">
          <p className="eyebrow">Client Portal</p>
          <h1 className="mt-2 font-serif text-2xl text-charcoal">Authenticating Account…</h1>
          <p className="mt-2 text-sm text-muted">Retrieving your studio records.</p>
        </div>
      </main>
    );
  }

  const tabs = [
    { label: "Dashboard", href: "/account" },
    { label: "Profile & Address", href: "/account/profile" },
    { label: "My Orders", href: "/account/orders" },
  ];

  return (
    <main className="min-h-screen bg-canvas pt-28 pb-20 px-6 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        {/* Account Header */}
        <div className="border-b border-line pb-8 sm:flex sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">Client Portal</span>
              <span className="text-xs text-muted/60">/</span>
              <span className="text-xs uppercase tracking-wider text-muted font-sans">
                Karachi Living Studio
              </span>
            </div>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-charcoal tracking-tight">
              {profile?.fullName || "Valued Client"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {user.email} &bull; Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          </div>

          <div className="mt-6 sm:mt-0 flex items-center gap-3">
            <a
              href="https://wa.me/923032566212?text=Hello%20Home%20Interior%20Karachi,%20I%20am%20inquiring%20about%20my%20account%20and%20orders."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs uppercase tracking-widest text-charcoal transition hover:border-champagne"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Studio Concierge
            </a>

            <button
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="rounded-full border border-line px-4 py-2 text-xs uppercase tracking-widest text-muted transition hover:border-red-300 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-line pb-px text-sm">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/account"
                ? pathname === "/account"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap pb-3 border-b-2 text-xs uppercase tracking-widest transition ${
                  isActive
                    ? "border-charcoal font-semibold text-charcoal"
                    : "border-transparent text-muted hover:text-charcoal"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Page Content */}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

