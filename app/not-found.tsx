/**
 * app/not-found.tsx
 * Elegant 404 — keeps navigation alive and offers the two real next steps.
 */

import Link from "next/link";
import { NAV_ALL, SITE } from "@/lib/site.config";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[70vh] items-center">
      <div className="container-wide py-20">
        <p className="eyebrow">Error 404</p>
        <h1 className="display-2 mt-6 max-w-2xl text-charcoal">
          This page is no longer part of the studio site.
        </h1>
        <p className="lede mt-6 max-w-xl">
          The link may be out of date, or the collection has been renamed. Use the navigation below,
          or speak to the studio directly.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/materials" className="btn btn-solid">
            Browse materials
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Start on WhatsApp
          </a>
        </div>

        <ul className="mt-14 grid gap-x-8 gap-y-3 border-t border-line pt-8 sm:grid-cols-3 lg:grid-cols-5">
          {NAV_ALL.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-charcoal"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
