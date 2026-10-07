"use client";

/**
 * components/ui/Header.tsx
 * Premium sticky header.
 * - solid canvas from first paint, with a calm sticky presentation
 * - keyboard accessible navigation with visible focus states
 * - mobile drawer: Escape to close, body scroll lock, focus trap, aria-modal
 * - search trigger (button, "/" shortcut, Cmd/Ctrl+K)
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchOverlay from "./SearchOverlay";
import { NAV_CONSULTATION, NAV_DRAWER_SECONDARY, NAV_PRIMARY, SITE } from "@/lib/site.config";
import type { SearchResult } from "@/lib/content/types";
import { cx } from "@/lib/utils";
import Logo from "./Logo";
import { STUDIO_CATEGORIES } from "@/lib/content/catalog";
import { useCart } from "@/lib/cart/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import AuthModal from "@/components/auth/AuthModal";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const { user, isAdmin } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMaterialsOpen, setMobileMaterialsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  /* "/" or Cmd/Ctrl+K opens search */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (!typing && event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Drawer: scroll lock, Escape, initial focus */
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }, 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        window.setTimeout(() => menuButtonRef.current?.focus(), 20);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  /* Mega Menu: click outside to close, escape to close */
  useEffect(() => {
    if (!megaMenuOpen) return;

    const onClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false);
      }
    };

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [megaMenuOpen]);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const container = drawerRef.current;
    if (!container) return;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  };

  const handleAccountClick = () => {
    if (user) {
      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } else {
      setAuthModalOpen(true);
    }
  };

  const iconButton = "btn-icon border border-line-strong bg-white/60 text-charcoal backdrop-blur-sm hover:bg-charcoal hover:text-white";

  const navLinkClass = (active: boolean) =>
    cx(
      "block whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.16em] transition-colors",
      active
        ? "text-charcoal underline decoration-champagne decoration-1 underline-offset-[6px]"
        : "text-charcoal hover:text-gold-deep"
    );

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-50 w-full border-b border-line bg-canvas text-charcoal"
        )}
      >
        <div className="container-wide mx-auto flex min-h-[76px] items-center justify-between gap-3 py-3 sm:gap-6 lg:min-h-[88px] lg:grid lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)_minmax(0,auto)] lg:items-center lg:gap-6 lg:py-0 2xl:gap-10">
        <Link
          href="/"
          className="flex min-w-0 max-w-[15rem] items-center gap-2.5 sm:gap-3 xl:max-w-[19rem] 2xl:max-w-none"
          aria-label={`${SITE.name} — home`}
        >
          <span className="relative flex h-12 w-14 shrink-0 items-center justify-center">
            <Logo />
          </span>
          <span className="min-w-0 leading-none">
            <span
              className={cx(
                "block truncate font-serif text-[13px] tracking-[0.15em] min-[400px]:text-[14px] min-[400px]:tracking-[0.16em]",
                "sm:text-[17px] sm:tracking-[0.22em]",
                "text-charcoal"
              )}
            >
              {SITE.name}
            </span>
              <span
                className={cx(
                  // Hidden through the lg range: at those widths the nav plus the
                  // CONSULTATION button need the room, and a clipped descriptor
                  // reads as a rendering fault. Full text returns from xl up.
                  "mt-1 hidden truncate text-[10px] uppercase tracking-[0.22em] xl:block",
                  "text-muted"
                )}
                title={SITE.descriptor}
              >
                {SITE.descriptor}
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden min-w-0 items-center gap-3 lg:gap-4 2xl:gap-8 lg:flex lg:justify-center">
            {NAV_PRIMARY.map((item) => {
              if (item.label === "MATERIALS & PRODUCTS") {
                return (
                  <div 
                    key={item.href} 
                    className="relative" 
                    ref={megaMenuRef}
                    onMouseEnter={() => setMegaMenuOpen(true)}
                    onMouseLeave={() => setMegaMenuOpen(false)}
                  >
                    <button
                      onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                      aria-expanded={megaMenuOpen}
                      className={navLinkClass(pathname.startsWith("/materials") || pathname === item.href)}
                    >
                      {item.label}
                    </button>
                    {megaMenuOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 w-max max-w-[80vw]">
                        <div className="bg-white/95 backdrop-blur-md border border-line p-8 shadow-2xl rounded-sm">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6">
                            {STUDIO_CATEGORIES.map((cat) => (
                              <Link
                                key={cat.slug}
                                href={`/materials/${cat.slug}`}
                                onClick={() => setMegaMenuOpen(false)}
                                className="group flex flex-col gap-1"
                              >
                                <span className="text-[12px] font-medium tracking-wider uppercase text-charcoal group-hover:text-gold-deep transition-colors">
                                  {cat.name}
                                </span>
                                <span className="text-[11px] text-muted line-clamp-1 max-w-[200px]">
                                  {cat.meta}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={navLinkClass(pathname === item.href)}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              className={navLinkClass(false)}
            >
              SEARCH
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 lg:justify-end">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the site (press / or Cmd+K)"
              className={iconButton}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="7" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeWidth={1.5} d="M20 20l-3.5-3.5" />
              </svg>
            </button>

            {/* Cart Trigger with Dynamic Item Count Badge */}
            <button
              type="button"
              onClick={openCart}
              aria-label={totalItems > 0 ? `Shopping cart with ${totalItems} items` : "Open shopping cart"}
              title="Bespoke Cart"
              className={cx(iconButton, "relative")}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {totalItems > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-champagne px-1 text-[10px] font-bold text-charcoal shadow-sm ring-2 ring-canvas"
                  aria-hidden="true"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* User Account / Login Trigger */}
            <button
              type="button"
              onClick={handleAccountClick}
              aria-label={user ? (isAdmin ? "Admin Console" : "Client Account") : "Sign In or Register"}
              title={user ? (isAdmin ? "Admin Console" : "Client Account") : "Sign In / Register"}
              className={cx(iconButton, "relative")}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {user && (
                <span
                  className={cx(
                    "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-canvas",
                    isAdmin ? "bg-champagne" : "bg-emerald-500"
                  )}
                  aria-hidden="true"
                />
              )}
            </button>

            {/* Consultation CTA */}
            <Link
              href="/consultation"
              className="btn btn-glass-dark hidden sm:inline-flex"
            >
              CONSULTATION
              <span aria-hidden="true">&rarr;</span>
            </Link>

            {/* Mobile Menu Trigger */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              className={cx(iconButton, "lg:hidden")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[60] cursor-default bg-charcoal/25"
          />
          <div
            id="mobile-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            onKeyDown={trapFocus}
            className="fixed inset-y-0 right-0 z-[61] flex w-[88%] max-w-sm flex-col overflow-y-auto border-l border-line bg-canvas px-7 pb-10 pt-7"
          >
            <div className="flex items-center justify-between">
              <span className="eyebrow">Menu</span>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  window.setTimeout(() => menuButtonRef.current?.focus(), 20);
                }}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong text-charcoal transition-colors hover:bg-charcoal hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeWidth={1.5} d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav aria-label="Mobile navigation" className="mt-10 flex flex-col">
              {NAV_PRIMARY.map((item) => {
                if (item.label === "MATERIALS & PRODUCTS") {
                  return (
                    <div key={item.href} className="border-b border-line flex flex-col">
                      <button
                        onClick={() => setMobileMaterialsOpen(!mobileMaterialsOpen)}
                        aria-expanded={mobileMaterialsOpen}
                        className="py-4 text-left font-serif text-2xl leading-snug text-charcoal transition-colors hover:text-gold-deep flex justify-between items-center"
                      >
                        {item.label}
                        <svg viewBox="0 0 24 24" className={cx("h-5 w-5 transition-transform", mobileMaterialsOpen && "rotate-180")} fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {mobileMaterialsOpen && (
                        <div className="flex flex-col gap-4 pb-6 pt-2 pl-4">
                          {STUDIO_CATEGORIES.map((cat) => (
                            <Link
                              key={cat.slug}
                              href={`/materials/${cat.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="text-lg text-charcoal hover:text-gold-deep font-serif transition-colors"
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="border-b border-line py-4 font-serif text-2xl leading-snug text-charcoal transition-colors hover:text-gold-deep"
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setSearchOpen(true);
                }}
                aria-haspopup="dialog"
                className="border-b border-line py-4 text-left font-serif text-2xl leading-snug text-charcoal transition-colors hover:text-gold-deep"
              >
                SEARCH
              </button>

              {NAV_DRAWER_SECONDARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="border-b border-line py-4 font-serif text-2xl leading-snug text-charcoal transition-colors hover:text-gold-deep"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href={NAV_CONSULTATION.href}
                onClick={() => setMobileOpen(false)}
                className="btn btn-glass-dark mt-9 self-start"
              >
                {NAV_CONSULTATION.label}
                <span aria-hidden="true">&rarr;</span>
              </Link>

              {/* Mobile Quick Client Actions */}
              <div className="mt-8 flex flex-col gap-2.5 border-t border-line pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openCart();
                  }}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal transition-colors hover:border-champagne hover:bg-surface"
                >
                  <span className="flex items-center gap-2.5">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-champagne"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                    <span>Bespoke Cart</span>
                  </span>
                  {totalItems > 0 ? (
                    <span className="rounded-full bg-champagne px-2 py-0.5 text-[10px] font-bold text-charcoal">
                      {totalItems} {totalItems === 1 ? "Item" : "Items"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted">0 Items</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleAccountClick();
                  }}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal transition-colors hover:border-champagne hover:bg-surface"
                >
                  <span className="flex items-center gap-2.5">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-champagne"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{user ? (isAdmin ? "Admin Console" : "Client Account") : "Client Sign In"}</span>
                  </span>
                  <span className="text-champagne font-semibold text-xs">→</span>
                </button>
              </div>
            </nav>

            <div className="mt-auto pt-12">
              <p className="eyebrow">HOME INTERIOR<br />KARACHI — BESPOKE LIVING STUDIO</p>
              <address className="mt-4 not-italic text-sm leading-relaxed text-muted">
                {SITE.addressLines.map((line, i) => <span key={line}  className="block">{line} </span>)}
              </address>
              <a href={SITE.phoneHref} className="mt-5 block text-sm text-charcoal">
                {SITE.phone}
              </a>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-champagne mt-6 w-full"
              >
                WHATSAPP
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Search Overlay Dialog */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Advanced Authentication Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}













