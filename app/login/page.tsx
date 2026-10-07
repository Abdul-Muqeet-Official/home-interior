"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { SITE } from "@/lib/site.config";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingState />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginLoadingState() {
  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-canvas px-6 py-20">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 sm:p-10 shadow-sm text-center">
        <p className="eyebrow text-champagne">Client Portal</p>
        <h1 className="mt-2 font-serif text-2xl text-charcoal">Connecting to Studio…</h1>
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setPending(true);

    try {
      const res = await signIn(email.trim(), password);
      if (res.error) {
        setError(res.error || "Invalid email or password.");
        return;
      }
      if (res.role === "admin") {
        router.push("/admin");
      } else {
        router.push(nextPath);
      }
    } catch {
      setError("An unexpected error occurred. Please verify your connection.");
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
            {/* Background Image with Dark Vignette */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/media/photos/work-featured.jpg"
                alt="HOME INTERIOR bespoke living space"
                fill
                priority
                className="object-cover opacity-35"
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/80 to-charcoal/50" />
            </div>

            {/* Top Identity */}
            <div className="relative z-10">
              <span className="font-serif text-2xl tracking-[0.24em] text-white">
                {SITE.name}
              </span>
              <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-champagne">
                Karachi · Bespoke Living Studio
              </p>
            </div>

            {/* Editorial Quote & Features */}
            <div className="relative z-10 space-y-6">
              <div className="h-px w-10 bg-champagne/60" />
              <blockquote className="font-serif text-xl italic leading-relaxed text-surface/90">
                “Bespoke material curation, precision architectural finishing, and turnkey execution for Karachi&apos;s most distinguished residences.”
              </blockquote>
              
              <div className="space-y-3 pt-2 text-xs text-surface/80">
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-semibold text-champagne">
                    01
                  </span>
                  <span>Architectural Material Consultations</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-semibold text-champagne">
                    02
                  </span>
                  <span>Real-Time Order & Swatch Sample Tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-champagne/20 text-[10px] font-semibold text-champagne">
                    03
                  </span>
                  <span>Direct Priority Studio WhatsApp Line</span>
                </div>
              </div>
            </div>

            {/* Studio Address Footnote */}
            <div className="relative z-10 border-t border-white/10 pt-4 text-[11px] text-muted/70">
              <p>Badar Commercial, Lane 11, DHA Phase 5, Karachi</p>
              <p className="mt-0.5 font-mono text-[10px]">Studio Helpline: 0323 2655111</p>
            </div>
          </div>

          {/* Right Column: High-End Client Login Form */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-7">
            {/* Top Switcher Tabs */}
            <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
              <div className="flex gap-6">
                <span className="relative pb-4 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal">
                  Sign In
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-champagne" />
                </span>
                <Link
                  href={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                  className="pb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition-colors hover:text-charcoal"
                >
                  Create Account
                </Link>
              </div>
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-muted font-mono">
                Client Portal
              </span>
            </div>

            <div>
              <p className="eyebrow text-champagne">Welcome Back</p>
              <h1 className="mt-1 font-serif text-3xl text-charcoal">Sign In to Your Account</h1>
              <p className="mt-2 text-sm text-muted">
                Review your saved specifications, material inquiries, and active interior orders.
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

            <div className="mt-7">
              <SocialLoginButtons onError={(err) => setError(err)} />
              <div className="relative my-7 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line" />
                </div>
                <span className="relative bg-pure px-4 text-[10px] uppercase tracking-[0.24em] text-muted">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface/40 px-4 py-3.5 text-sm text-charcoal outline-none transition duration-200 focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                    placeholder="client@luxuryresidence.com"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted hover:text-champagne transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface/40 px-4 py-3.5 pr-11 text-sm text-charcoal outline-none transition duration-200 focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-charcoal transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-black hover:shadow-lg disabled:opacity-50"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-champagne" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Accessing Client Vault…
                  </span>
                ) : (
                  <>
                    <span>Sign In to Client Account</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick WhatsApp checkout callout */}
            <div className="mt-8 rounded-xl border border-line bg-surface/60 p-4 text-xs text-charcoal">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-charcoal flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Instant WhatsApp Consultation
                </span>
                <a
                  href="https://wa.me/923032566212"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-champagne hover:underline"
                >
                  Direct Chat ↗
                </a>
              </div>
              <p className="mt-1 text-muted text-[11px] leading-relaxed">
                Need quick material swatches or project estimates? You can order directly on WhatsApp without signing in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
