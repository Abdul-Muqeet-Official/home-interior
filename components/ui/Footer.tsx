/**
 * components/ui/Footer.tsx
 * Studio footer: brand mark, verified address, contact routes and navigation.
 * Every address line, phone number and WhatsApp link comes from
 * lib/site.config.ts — the single source of truth for studio contact details.
 */

import Image from "next/image";
import Link from "next/link";
import { FOOTER_NAV, LEGAL_NAV, SITE } from "@/lib/site.config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Studio information and site navigation
      </h2>

      <div className="container-editorial grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo.png" alt="HOME INTERIOR" width={44} height={44} className="object-contain" />
            <span className="leading-none">
              <span className="block font-serif text-[15px] tracking-[0.26em] text-charcoal">
                {SITE.name}
              </span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.28em] text-muted">
                {SITE.descriptor}
              </span>
            </span>
          </div>

          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">{SITE.description}</p>
        </div>

        <div className="lg:col-span-3">
          <p className="eyebrow">HOME INTERIOR<br />KARACHI — BESPOKE LIVING STUDIO</p>
          <address className="mt-5 not-italic text-[13px] uppercase leading-[1.9] tracking-[0.14em] text-muted">
            {SITE.addressLines.map((line, i) => <span key={line}  className="block">{line} </span>)}
          </address>
        </div>

        <nav className="lg:col-span-2" aria-label="Footer navigation">
          <p className="eyebrow">Navigate</p>
          <ul className="mt-5 space-y-3">
            {FOOTER_NAV.map((item) => (
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
        </nav>

        <div className="lg:col-span-3">
          <p className="eyebrow">Contact</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a href={SITE.phoneHref} className="text-charcoal transition-colors hover:text-gold-deep">
                {SITE.phone}
              </a>
            </li>
            <li>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-wrap items-center gap-2 text-charcoal transition-colors hover:text-gold-deep"
              >
                <span>
                  WhatsApp <span aria-hidden="true">→</span>
                </span>
                <span>{SITE.whatsapp}</span>
              </a>
            </li>
          </ul>

          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-solid mt-7"
          >
            WHATSAPP
            <span aria-hidden="true">→</span>
          </a>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-charcoal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-editorial flex flex-col gap-3 py-6 text-[10px] uppercase tracking-[0.24em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {SITE.name}. ALL RIGHTS RESERVED.</p>
          <p>PRIVATE CONSULTATIONS BY APPOINTMENT</p>
        </div>
      </div>
    </footer>
  );
}


