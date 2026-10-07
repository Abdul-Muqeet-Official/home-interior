"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { SITE } from "@/lib/site.config";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetLoadingState />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetLoadingState() {
  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-canvas px-6 py-20">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 sm:p-10 shadow-sm text-center">
        <p className="eyebrow text-champagne">Client Security</p>
        <h1 className="mt-2 font-serif text-2xl text-charcoal">Validating Session…</h1>
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

function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

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
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        setError(updateError || "Failed to update password.");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/account");
      }, 1500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
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
                Security Credentials
              </p>
            </div>
            <span className="text-[11px] font-mono text-muted">DHA Phase 5</span>
          </div>

          <div className="mt-6">
            <h1 className="font-serif text-3xl text-charcoal">Choose New Password</h1>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Configure a fresh, secure passkey for your registered client account.
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
                Password Successfully Updated
              </p>
              <p className="mt-1.5 text-emerald-800">
                Your new passkey is now active. Transferring you securely to your client area…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal"
                >
                  New Passkey (Minimum 6 Characters)
                </label>
                <div className="relative mt-2">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface/40 px-4 py-3.5 pr-11 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-charcoal transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-new-password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal"
                >
                  Confirm New Passkey
                </label>
                <input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-surface/40 px-4 py-3.5 text-sm text-charcoal outline-none transition focus:border-champagne focus:bg-pure focus:ring-1 focus:ring-champagne"
                  placeholder="••••••••••••"
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
                    Updating Credentials…
                  </span>
                ) : (
                  <>
                    <span>Confirm & Update Password</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              <div className="border-t border-line pt-4 text-center">
                <Link
                  href="/login"
                  className="text-xs text-muted hover:text-charcoal transition-colors"
                >
                  ← Return to Client Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
