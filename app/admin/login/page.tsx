"use client";

/**
 * app/admin/login/page.tsx
 * HOME INTERIOR — VIP Executive Control Center Login.
 * Authenticates against /api/admin/session which sets the HttpOnly session cookie.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SITE } from "@/lib/site.config";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginShell />}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginShell() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0F0E0D] px-6 py-16 text-[#F3EEE7]">
      <div className="w-full max-w-md rounded-2xl border border-[#2D2A26] bg-[#161514] p-8 sm:p-10 shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C5A880]">
          Executive Control Center
        </p>
        <h1 className="mt-3 font-serif text-3xl text-white">Initializing Vault…</h1>
        <p className="mt-3 text-sm text-[#8E8A83]">Preparing secure session authentication…</p>
      </div>
    </main>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nextPath = (() => {
    const target = searchParams.get("next");
    return target && target.startsWith("/admin") ? target : "/admin";
  })();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Authentication failed. Invalid administrator credentials.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Network error encountered during authentication. Please check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0C0B0A] px-4 py-16 text-[#F3EEE7]">
      {/* Architectural Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{
          background: "radial-gradient(ellipse at center, #C5A880 0%, #1A1816 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      
      {/* Subtle Grid Lines Background */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#C5A880 1px, transparent 1px), linear-gradient(90deg, #C5A880 1px, transparent 1px)",
          backgroundSize: "64px 64px"
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Top Studio Brand Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-85">
            <span className="font-serif text-3xl tracking-[0.24em] text-white">
              {SITE.name}
            </span>
          </Link>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-6 bg-[#C5A880]/40" />
            <p className="text-[10px] uppercase tracking-[0.32em] text-[#C5A880]">
              Karachi · Bespoke Living Studio
            </p>
            <span className="h-px w-6 bg-[#C5A880]/40" />
          </div>
        </div>

        {/* Master Card */}
        <div className="rounded-2xl border border-[#262421] bg-[#141312]/95 p-8 sm:p-11 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-md">
          {/* Badge & Title */}
          <div className="flex items-center justify-between border-b border-[#23211E] pb-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/20 bg-[#C5A880]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C5A880]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C5A880] animate-pulse" />
                VIP Control Center
              </span>
              <h1 className="mt-3 font-serif text-2xl tracking-tight text-white sm:text-3xl">
                Studio Management Portal
              </h1>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#78746D]">
                DHA Phase 5
              </span>
              <p className="text-xs font-mono text-[#A49F96]">Karachi, PK</p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#9B968E]">
            This terminal is strictly restricted to verified studio operators and administrators.
            All catalogue updates, pricing rules, and orders sync live to the production store.
          </p>

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-lg border border-red-900/40 bg-red-950/40 p-4 text-xs leading-relaxed text-red-200"
            >
              <svg className="h-4 w-4 shrink-0 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C5A880]"
              >
                Administrator Email
              </label>
              <div className="relative mt-2">
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@homeinterior.pk"
                  className="w-full rounded-xl border border-[#2D2A26] bg-[#0E0D0C] px-4 py-3.5 text-sm text-white placeholder-[#58544E] outline-none transition-all duration-200 focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#58544E]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C5A880]"
                >
                  Master Passkey
                </label>
              </div>
              <div className="relative mt-2">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full rounded-xl border border-[#2D2A26] bg-[#0E0D0C] px-4 py-3.5 pr-11 text-sm text-white placeholder-[#58544E] outline-none transition-all duration-200 focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#78746D] hover:text-[#C5A880] transition-colors"
                  aria-label={showPassword ? "Hide passkey" : "Show passkey"}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#C5A880] bg-[#C5A880] px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#121214] shadow-[0_4px_20px_rgba(197,168,128,0.25)] transition-all duration-300 hover:bg-[#D9C4A2] hover:shadow-[0_6px_28px_rgba(197,168,128,0.35)] disabled:opacity-50"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authorizing Studio Access…
                </span>
              ) : (
                <>
                  <span>Authenticate & Enter Control Center</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-8 border-t border-[#23211E] pt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#8E8A83] transition-colors hover:text-[#C5A880]"
            >
              <span>← Return to Public Showroom</span>
            </Link>
          </div>
        </div>

        {/* Bottom security pill */}
        <div className="mt-6 flex items-center justify-center gap-4 text-center text-[11px] text-[#63605A]">
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-[#C5A880]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            256-Bit Encrypted Session
          </span>
          <span>·</span>
          <span>Role-Based Access Enforcement</span>
        </div>
      </div>
    </main>
  );
}
