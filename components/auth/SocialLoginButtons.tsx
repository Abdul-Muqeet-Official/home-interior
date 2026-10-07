"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

interface SocialLoginButtonsProps {
  onError?: (err: string) => void;
  className?: string;
}

export default function SocialLoginButtons({ onError, className = "" }: SocialLoginButtonsProps) {
  const { signInWithOAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "facebook" | "instagram") => {
    setLoadingProvider(provider);
    try {
      const res = await signInWithOAuth(provider);
      if (res?.error && onError) {
        onError(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isProviderDisabled =
        msg.toLowerCase().includes("not enabled") ||
        msg.toLowerCase().includes("unsupported provider") ||
        msg.toLowerCase().includes("validation_failed");
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      if (onError) {
        onError(
          isProviderDisabled
            ? `This social provider (${providerName}) is currently being configured by the studio. Please use Email/Password in the meantime.`
            : msg || "Social authentication failed."
        );
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Google */}
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={Boolean(loadingProvider)}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal shadow-sm transition duration-200 hover:bg-neutral-50 hover:border-charcoal disabled:opacity-50"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
        <span>
          {loadingProvider === "google" ? "Connecting to Google..." : "Continue with Google"}
        </span>
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={() => handleOAuth("facebook")}
        disabled={Boolean(loadingProvider)}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal shadow-sm transition duration-200 hover:bg-neutral-50 hover:border-charcoal disabled:opacity-50"
      >
        <svg className="h-4 w-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>
          {loadingProvider === "facebook" ? "Connecting to Facebook..." : "Continue with Facebook"}
        </span>
      </button>

      {/* Instagram */}
      <button
        type="button"
        onClick={() => handleOAuth("instagram")}
        disabled={Boolean(loadingProvider)}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal shadow-sm transition duration-200 hover:bg-neutral-50 hover:border-charcoal disabled:opacity-50"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="url(#ig-grad-btn)"
            d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
          />
          <defs>
            <linearGradient id="ig-grad-btn" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </linearGradient>
          </defs>
        </svg>
        <span>
          {loadingProvider === "instagram" ? "Connecting to Instagram..." : "Continue with Instagram"}
        </span>
      </button>
    </div>
  );
}

export { SocialLoginButtons };
