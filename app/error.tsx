"use client";

/**
 * app/error.tsx
 * Friendly, recoverable error state. No stack traces are shown to visitors.
 */

import { useEffect } from "react";
import { SITE } from "@/lib/site.config";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side logging only; the visitor sees a friendly message.
    console.error("[home-interior] page error:", error.message);
  }, [error]);

  return (
    <main id="main" className="flex min-h-[70vh] items-center">
      <div className="container-wide py-20">
        <p className="eyebrow">Temporary issue</p>
        <h1 className="display-2 mt-6 max-w-2xl text-charcoal">
          We could not load this section just now.
        </h1>
        <p className="lede mt-6 max-w-xl">
          The catalogue is still available. Please retry, or reach the studio and we will answer
          directly.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-solid">
            Try again
          </button>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Start on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
