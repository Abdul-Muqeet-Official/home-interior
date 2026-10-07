/**
 * app/materials/carpet-tile/[collection]/not-found.tsx
 *
 * An unknown or unpublished collection slug must read as a quiet, branded absence —
 * never a stack trace, a blank screen or a dead end.
 */

import Link from "next/link";
import { SITE } from "@/lib/site.config";

export default function CarpetTileCollectionNotFound() {
  return (
    <main id="main" className="flex min-h-[70vh] items-center">
      <div className="container-wide py-20">
        <p className="eyebrow">Carpet tile</p>
        <h1 className="display-2 mt-6 max-w-2xl text-charcoal">
          This collection is not in the studio library.
        </h1>
        <p className="lede mt-6 max-w-xl">
          The collection may have been renamed, or it is not yet published. Browse the
          full carpet tile library, or ask the studio to pull a specific catalogue.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/materials/carpet-tile" className="btn btn-solid">
            ALL CARPET TILE
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/consultation" className="btn btn-outline">
            REQUEST A CONSULTATION
          </Link>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            WHATSAPP
          </a>
        </div>
      </div>
    </main>
  );
}
