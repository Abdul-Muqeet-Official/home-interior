"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { SITE } from "@/lib/site.config";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoadingState />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupLoadingState() {
  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-canvas px-6 py-20">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 sm:p-10 shadow-sm text-center">
        <p className="eyebrow text-champagne">Client Portal</p>
        <h1 className="mt-2 font-serif text-2xl text-charcoal">Loading Registration…</h1>
        <div className="mt-6 flex justify-center">
          <svg className="h-6 w-6 animate-spin text-champagne" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </div>
    </main>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signUp, isLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nextPath = searchParams.get("next") || "/account";

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(nextPath);
    }
  }, [user, isLoading, router, nextPath]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      const { error: signUpError } = await signUp(email.trim(), password, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      if (signUpError) {
        setError(signUpError || "Unable to register client account.");
        return;
      }

      setSuccess("Client account established! Redirecting to your personal account…");
      setTimeout(() => {
        router.push(nextPath);
      }, 1200);
    } catch {
      setError("An unexpected error occurred during registration. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-[88vh] bg-canvas py-8 sm:py-14">
      <div className="container-wide">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-line bg-pure shadow-[0_12px_45px_rgba(18,18,20,0.06)] lg:grid-cols-12">
          
          {/* Left Column: Architectural Editorial Atmosphere */}
          <div className="relative hidden bg-charcoal p-10 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 z-0">
              <Image
                src="/media/photos/hero-01.jpg"
                alt="HOME INTERIOR architectural design"
                fill
                priority
                className="object-cover opacity-35"
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/50" />
            </div>

            <div className="relative z-10">
              <span className="font-serif text-2xl tracking-[0.24em] text-white">
                {SITE.name}
              </span>
              <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-champagne">
                Karachi · Bespoke Living Studio
              </p>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="h-px w-10 bg-champagne/60" />
              <blockquote className="font-serif text-xl italic leading-relaxed text-surface/90">
                “Join our private client registry for bespoke project estimates, direct material sampling, and architectural consultation records.”
              </blockquote>
              
              <div className="space-y-3 pt-2 text-xs text-surface/80">
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-semibold text-champagne">
                    ✓
                  </span>
                  <span>Direct Delivery to DHA, Clifton, Bahria & Nationwide</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-semibold text-champagne">
                    ✓
                  </span>
                  <span>Instant Cart Sync Across All Devices</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-semibold text-champagne">
                    ✓
                  </span>
                  <span>Direct Turnkey Installation Bookings</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/10 pt-4 text-[11px] text-muted/70">
              <p>Badar Commercial, Lane 11, DHA Phase 5, Karachi</p>
              <p className="mt-0.5 font-mono text-[10px]">Studio Direct Line: 0323 2655111</p>
            </div>
          </div>

          {/* Right Column: High-End Client Registration Form */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-7">
            {/* Top Switcher Tabs */}
            <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
              <div className="flex gap-6">
                <Link
                  href={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                  className="pb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition-colors hover:text-charcoal"
                >
                  Sign In
                </Link>
                <span className="relative pb-4 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal">
                  Create Account
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-champagne" />
                </span>
              </div>
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-muted font-mono">
                Client Registration
              </span>
            </div>

            <div>
              <p className="eyebrow text-champagne">New Client</p>
              <h1 className="mt-1 font-serif text-3xl text-charcoal">Create Client Profile</h1>
              <p className="mt-2 text-sm text-muted">
                Register to track orders, save material selections, and request sample deliveries.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs leading-relaxed text-red-900"
              >
                <svg className="h-4 w-4 shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs leading-relaxed text-emerald-900"
              >
                <svg className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Social Registration */}
            <div className="mt-7">
              <SocialLoginButtons />
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[10px] uppercase tracking-widest text-muted">Or with email details</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fullName" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                    placeholder="Syed Tariq"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                    WhatsApp Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                    placeholder="0300 1234567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                  placeholder="client@bespoke.com"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                  Delivery / Residence Address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                  placeholder="DHA Phase 6, Karachi"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-password" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                    Password (Min 6)
                  </label>
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-muted hover:text-charcoal transition-colors flex items-center gap-1.5"
                >
                  <span>{showPassword ? "Hide" : "Show"} password characters</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-black hover:shadow-lg disabled:opacity-50"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-champagne" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Registering Profile…
                  </span>
                ) : (
                  <>
                    <span>Create Client Account</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
