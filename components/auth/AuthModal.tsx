"use client";

/**
 * components/auth/AuthModal.tsx
 * Ultra-Luxury Studio Access & Client Authentication Modal for VIP Home Interior.
 *
 * SUPABASE PROVIDER SETUP INSTRUCTIONS:
 * -------------------------------------------------------------
 * If social sign-in returns "Unsupported provider: provider is not enabled":
 * 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/<your-project-id>
 * 2. Navigate to: Authentication -> Providers
 * 3. Configure the desired providers:
 *    - GOOGLE:
 *      - Toggle Enabled to ON.
 *      - Paste Client ID and Client Secret from Google Cloud Console.
 *      - Set Redirect URL in Google Console: https://<your-project-id>.supabase.co/auth/v1/callback
 *    - FACEBOOK / INSTAGRAM:
 *      - Toggle Enabled to ON.
 *      - Paste App ID and App Secret from Meta for Developers (developers.facebook.com).
 *      - Set Valid OAuth Redirect URI: https://<your-project-id>.supabase.co/auth/v1/callback
 * -------------------------------------------------------------
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cx } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = "signin",
}: AuthModalProps) {
  const router = useRouter();
  const { signIn, signUp, signInWithOAuth } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<
    "google" | "facebook" | "instagram" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccess("Credentials verified. Entering studio portal…");
          setTimeout(() => {
            onClose();
            if (res.role === "admin") {
              router.push("/admin");
            } else {
              router.push("/account");
            }
          }, 700);
        }
      } else {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        const res = await signUp(email, password, {
          fullName,
          phone,
          address,
        });

        if (res.error) {
          setError(res.error);
        } else {
          setSuccess("Client profile registered! Redirecting to studio dashboard…");
          setTimeout(() => {
            onClose();
            router.push("/account");
          }, 800);
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication encountered an unexpected issue."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Robust OAuth Handler with safe try/catch and graceful 400 provider fallback
   */
  const handleOAuth = async (
    provider: "google" | "facebook" | "instagram"
  ) => {
    setError(null);
    setSuccess(null);
    setSocialLoading(provider);

    try {
      const res = await signInWithOAuth(provider);
      if (res?.error) {
        setError(res.error);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isProviderDisabled =
        errMsg.toLowerCase().includes("not enabled") ||
        errMsg.toLowerCase().includes("unsupported provider") ||
        errMsg.toLowerCase().includes("validation_failed");

      if (isProviderDisabled) {
        const providerName =
          provider === "google"
            ? "Google"
            : provider === "facebook"
            ? "Facebook"
            : "Instagram";
        setError(
          `This social provider (${providerName}) is currently being configured by the studio. Please use Email/Password or the Admin Vault in the meantime.`
        );
      } else {
        setError(errMsg || "Social authentication failed.");
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* High-End Obsidian Backdrop with Cinematic Blur */}
      <div
        className="fixed inset-0 bg-[#0A0908]/85 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Ultra-Luxury Modal Container */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#C5A880]/35 bg-gradient-to-b from-[#181614] via-[#141210] to-[#0E0D0C] p-7 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_60px_rgba(197,168,128,0.1)] text-white backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Ambient Warm Golden Sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-champagne/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-0 h-44 w-64 rounded-full bg-champagne/10 blur-3xl"
        />

        {/* Close Button Pill */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="group absolute right-5 top-5 sm:right-6 sm:top-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-champagne/60 hover:bg-champagne/15 hover:text-champagne"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 6l12 12M18 6L6 18"
            />
          </svg>
        </button>

        {/* Studio Brand Eyebrow */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-champagne/40 bg-champagne/10 text-[9px] text-champagne font-serif font-bold">
            ✦
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-champagne">
            VIP HOME INTERIOR · STUDIO ACCESS
          </span>
        </div>

        {/* Modal Heading */}
        <h2
          id="auth-modal-title"
          className="mt-3 font-serif text-2xl font-normal text-white sm:text-3xl tracking-tight"
        >
          {mode === "signin"
            ? "Private Studio Sign In"
            : "Register Client Portfolio"}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
          {mode === "signin"
            ? "Access your interior specifications, private consultations, and live orders."
            : "Join our Karachi bespoke studio client directory for custom project sampling."}
        </p>

        {/* Mode Segmented Tab Switcher */}
        <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setSuccess(null);
            }}
            className={cx(
              "rounded-lg py-2.5 text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-300",
              mode === "signin"
                ? "bg-gradient-to-r from-champagne/25 to-champagne/10 text-champagne border border-champagne/40 shadow-sm"
                : "text-white/50 hover:text-white"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setSuccess(null);
            }}
            className={cx(
              "rounded-lg py-2.5 text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-300",
              mode === "signup"
                ? "bg-gradient-to-r from-champagne/25 to-champagne/10 text-champagne border border-champagne/40 shadow-sm"
                : "text-white/50 hover:text-white"
            )}
          >
            Create Account
          </button>
        </div>

        {/* Luxury Notification Toast / Feedback Alert */}
        {error && (
          <div
            role="alert"
            className={cx(
              "mt-5 flex items-start gap-3 rounded-xl border p-3.5 text-xs leading-relaxed backdrop-blur-md transition-all duration-300",
              error.includes("configured")
                ? "border-champagne/40 bg-[#1F1C18]/95 text-champagne shadow-[0_0_20px_rgba(197,168,128,0.1)]"
                : "border-red-500/40 bg-red-950/45 text-red-200"
            )}
          >
            <span className="shrink-0 text-sm leading-none mt-0.5">
              {error.includes("configured") ? "✦" : "!"}
            </span>
            <div className="flex-1">
              <span className="block font-semibold uppercase tracking-wider text-[10px]">
                {error.includes("configured")
                  ? "Studio Notification"
                  : "Authentication Notice"}
              </span>
              <span className="mt-0.5 block opacity-95">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss message"
              className="text-xs opacity-60 hover:opacity-100 transition-opacity ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 backdrop-blur-md"
          >
            <span className="text-emerald-400 font-bold shrink-0">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* One-Tap Social Logins with Discrete Provider Spinners */}
        <div className="mt-6 space-y-2.5">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={Boolean(socialLoading) || loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:border-champagne/50 hover:bg-white/[0.07] hover:shadow-[0_0_20px_rgba(197,168,128,0.12)] disabled:opacity-50"
          >
            {socialLoading === "google" ? (
              <span className="flex items-center gap-2 text-champagne">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Connecting to Google…</span>
              </span>
            ) : (
              <>
                <svg
                  className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.14C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.27 6.59l4.01 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              disabled={Boolean(socialLoading) || loading}
              className="group flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:border-champagne/50 hover:bg-white/[0.07] disabled:opacity-50"
            >
              {socialLoading === "facebook" ? (
                <span className="flex items-center gap-1.5 text-champagne text-[11px]">
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Connecting…</span>
                </span>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 shrink-0 fill-[#1877F2] transition-transform group-hover:scale-110"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </>
              )}
            </button>

            {/* Instagram */}
            <button
              type="button"
              onClick={() => handleOAuth("instagram")}
              disabled={Boolean(socialLoading) || loading}
              className="group flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:border-champagne/50 hover:bg-white/[0.07] disabled:opacity-50"
            >
              {socialLoading === "instagram" ? (
                <span className="flex items-center gap-1.5 text-champagne text-[11px]">
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>Connecting…</span>
                </span>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="url(#ig-grad-modal-auth)"
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    />
                    <defs>
                      <linearGradient
                        id="ig-grad-modal-auth"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#fdf497" />
                        <stop offset="5%" stopColor="#fdf497" />
                        <stop offset="45%" stopColor="#fd5949" />
                        <stop offset="60%" stopColor="#d6249f" />
                        <stop offset="90%" stopColor="#285AEB" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span>Instagram</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.26em] text-white/40 font-mono">
            Or with email credentials
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Syed Tariq"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-champagne focus:bg-white/[0.07] focus:ring-1 focus:ring-champagne/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90 mb-1">
                    WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-champagne focus:bg-white/[0.07] focus:ring-1 focus:ring-champagne/40"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90 mb-1">
                    Location / Area
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="DHA Phase 6, Karachi"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-champagne focus:bg-white/[0.07] focus:ring-1 focus:ring-champagne/40"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@bespoke.com"
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-champagne focus:bg-white/[0.07] focus:ring-1 focus:ring-champagne/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-champagne/90">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] uppercase tracking-wider text-champagne/70 hover:text-champagne transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-champagne focus:bg-white/[0.07] focus:ring-1 focus:ring-champagne/40"
            />
          </div>

          {/* Primary Submit CTA */}
          <button
            type="submit"
            disabled={loading || Boolean(socialLoading)}
            className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#C5A880] via-[#D8C09D] to-[#C5A880] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-charcoal shadow-[0_4px_25px_rgba(197,168,128,0.3)] transition-all duration-300 hover:shadow-[0_6px_35px_rgba(197,168,128,0.5)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-charcoal"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Authenticating Studio…</span>
              </span>
            ) : (
              <>
                <span>
                  {mode === "signin"
                    ? "Enter Studio Account"
                    : "Create Studio Account"}
                </span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </button>
        </form>

        {/* Sophisticated Admin Vault Link */}
        <div className="mt-7 flex items-center justify-between rounded-xl border border-champagne/20 bg-champagne/[0.05] p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-champagne/30 bg-champagne/10 text-champagne text-xs">
              🛡️
            </span>
            <div className="text-left">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-champagne">
                Admin Vault
              </span>
              <span className="block text-[10px] text-white/50">
                Studio management & RBAC console
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/admin");
            }}
            className="rounded-lg border border-champagne/40 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-champagne hover:border-champagne hover:bg-champagne hover:text-charcoal transition-all"
          >
            Enter Vault →
          </button>
        </div>
      </div>
    </div>
  );
}
