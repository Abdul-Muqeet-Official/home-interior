"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { SITE } from "@/lib/site.config";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const { error: resetError } = await resetPassword(email.trim());
      if (resetError) {
        setError(resetError || "Failed to dispatch password recovery link.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-[85vh] bg-canvas py-12 sm:py-20 flex items-center justify-center">
      <div className="container-editorial">
        <div className="mx-auto max-w-lg rounded-2xl border border-line bg-pure p-8 sm:p-12 shadow-[0_12px_45px_rgba(18,18,20,0.06)]">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <span className="font-serif text-lg tracking-[0.2em] text-charcoal">
                {SITE.name}
              </span>
              <p className="text-[10px] uppercase tracking-[0.24em] text-champagne">
                Client Account Recovery
              </p>
            </div>
            <span className="text-[11px] font-mono text-muted">DHA Phase 5</span>
          </div>

          <div className="mt-6">
            <h1 className="font-serif text-3xl text-charcoal">Reset Account Passkey</h1>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Enter your registered client email address and we will dispatch a secure link to reset your account password.
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

          {success ? (
            <div
              role="status"
              className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs leading-relaxed text-emerald-950"
            >
              <p className="font-semibold text-emerald-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Password Reset Link Dispatched
              </p>
              <p className="mt-1.5 text-emerald-800">
                Please inspect your inbox (and junk / spam folder) for instructions to configure a new client password.
              </p>
              <div className="mt-5 pt-4 border-t border-emerald-200/60">
                <Link
                  href="/login"
                  className="font-semibold text-charcoal hover:text-champagne transition-colors"
                >
                  ← Return to Client Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal"
                >
                  Registered Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3.5 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                  placeholder="client@bespoke.com"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-black hover:shadow-lg disabled:opacity-50"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-champagne" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Dispatching Link…
                  </span>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              <div className="border-t border-line pt-4 text-center">
                <Link
                  href="/login"
                  className="text-xs text-muted hover:text-charcoal transition-colors"
                >
                  Remember your password? Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
