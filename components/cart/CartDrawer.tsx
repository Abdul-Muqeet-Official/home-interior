"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import { cx } from "@/lib/utils";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
  } = useCart();
  const { user, profile } = useAuth();

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details">("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll and attach Escape key listener when Cart Drawer is open
  React.useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart]);

  // Pre-fill fields when entering checkout step
  const handleProceedToDetails = () => {
    if (profile?.fullName && !name) setName(profile.fullName);
    if (profile?.phone && !phone) setPhone(profile.phone);
    if (user?.email && !email) setEmail(user.email);
    if (profile?.address && !address) setAddress(profile.address);
    setCheckoutStep("details");
  };

  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please provide your name and WhatsApp phone number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        deliveryAddress: address.trim() || undefined,
        notes: notes.trim() || undefined,
        userId: user?.id || null,
        items: items.map((i) => ({
          productId: i.productId,
          slug: i.slug,
          quantity: i.quantity,
          name: i.name,
          category: i.category,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process order. Please try again.");
        setSubmitting(false);
        return;
      }

      // Order created successfully! Open WhatsApp
      clearCart();
      setCheckoutStep("cart");
      closeCart();

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("An unexpected error occurred. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden" aria-labelledby="cart-title" role="dialog" aria-modal="true">
      {/* High-End Backdrop with Cinematic Blur */}
      <div
        className="fixed inset-0 bg-[#0A0908]/75 backdrop-blur-md transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-canvas border-l border-line shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-surface/90 backdrop-blur-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-champagne">
                  Bespoke Studio
                </span>
              </div>
              <h2 id="cart-title" className="font-serif text-xl tracking-[0.08em] text-charcoal uppercase mt-0.5">
                {checkoutStep === "cart" ? "Shopping Cart" : "Customer Details"}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted mt-0.5">
                {items.length} {items.length === 1 ? "Product" : "Products"} ({totalItems} items)
              </p>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong text-charcoal transition-colors hover:bg-charcoal hover:text-white"
              aria-label="Close cart"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full border border-line flex items-center justify-center mb-4 text-muted">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl text-charcoal">Your cart is empty</h3>
                <p className="mt-2 text-sm text-muted max-w-xs">
                  Explore our bespoke interior materials and architectural finishes to add items.
                </p>
                <Link
                  href="/materials"
                  onClick={closeCart}
                  className="btn btn-solid mt-6 text-xs uppercase tracking-[0.2em]"
                >
                  Explore Materials
                </Link>
              </div>
            ) : checkoutStep === "cart" ? (
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item.productId} className="py-5 flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-line bg-surface">
                      <Image
                        src={item.image || "/media/texture-plaster.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={closeCart}
                            className="text-sm font-medium text-charcoal hover:text-champagne transition-colors leading-snug"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-muted hover:text-charcoal p-1"
                            aria-label={`Remove ${item.name}`}
                          >
                            &times;
                          </button>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted mt-1">
                          {item.category}
                        </p>
                        {item.dimensions && (
                          <p className="text-[11px] text-muted/80 mt-0.5">
                            {item.dimensions}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-line rounded">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-2.5 py-0.5 text-xs text-charcoal hover:bg-surface"
                            aria-label="Decrease quantity"
                          >
                            &minus;
                          </button>
                          <span className="px-2 text-xs font-medium text-charcoal min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-2.5 py-0.5 text-xs text-charcoal hover:bg-surface"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-serif text-charcoal">
                          {item.price && item.price > 0 ? (
                            `PKR ${(item.price * item.quantity).toLocaleString()}`
                          ) : (
                            <span className="text-[11px] text-muted">On consultation</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <form id="order-form" onSubmit={handleWhatsAppCheckout} className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Provide your details to generate your customized quotation order. Our studio will connect directly via WhatsApp.
                </p>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="customer-name" className="block text-[11px] uppercase tracking-[0.2em] text-charcoal font-medium">
                    Your Name *
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="mt-1.5 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-charcoal focus:border-champagne focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="customer-phone" className="block text-[11px] uppercase tracking-[0.2em] text-charcoal font-medium">
                    WhatsApp Phone *
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                    className="mt-1.5 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-charcoal focus:border-champagne focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="customer-email" className="block text-[11px] uppercase tracking-[0.2em] text-charcoal font-medium">
                    Email Address (Optional)
                  </label>
                  <input
                    id="customer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="mt-1.5 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-charcoal focus:border-champagne focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="customer-address" className="block text-[11px] uppercase tracking-[0.2em] text-charcoal font-medium">
                    Project / Delivery Address
                  </label>
                  <textarea
                    id="customer-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. DHA Phase 6, Karachi"
                    className="mt-1.5 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-charcoal focus:border-champagne focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="customer-notes" className="block text-[11px] uppercase tracking-[0.2em] text-charcoal font-medium">
                    Special Requirements / Notes
                  </label>
                  <textarea
                    id="customer-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Need measurement inspection or urgent delivery"
                    className="mt-1.5 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-charcoal focus:border-champagne focus:outline-none resize-none"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-line px-6 py-5 bg-surface space-y-4">
              {checkoutStep === "cart" ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">Estimated Total</span>
                    <span className="font-serif text-xl text-charcoal">
                      {subtotal > 0 ? `PKR ${subtotal.toLocaleString()}` : "Price on consultation"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Pricing and delivery timelines will be confirmed via WhatsApp consultation with the studio.
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleProceedToDetails}
                      className="btn btn-solid w-full flex justify-center items-center gap-2 py-3.5 text-xs uppercase tracking-[0.24em]"
                    >
                      <span>ORDER VIA WHATSAPP</span>
                      <span aria-hidden="true">&rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={closeCart}
                      className="btn btn-outline w-full py-2.5 text-xs uppercase tracking-[0.2em]"
                    >
                      CONTINUE SHOPPING
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    type="submit"
                    form="order-form"
                    disabled={submitting}
                    className="btn btn-solid w-full flex justify-center items-center gap-2 py-3.5 text-xs uppercase tracking-[0.24em] disabled:opacity-50"
                  >
                    <span>{submitting ? "PREPARING ORDER…" : "CONFIRM & OPEN WHATSAPP"}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    disabled={submitting}
                    className="btn btn-outline w-full py-2.5 text-xs uppercase tracking-[0.2em]"
                  >
                    BACK TO CART
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

