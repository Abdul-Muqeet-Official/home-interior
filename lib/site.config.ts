/**
 * lib/site.config.ts
 * Single source of truth for brand, contact and navigation.
 * Every value here is business-verified — nothing in this file is invented.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const SITE = {
  /**
   * Visible brand. The legal/technical identifiers stay lowercase in code,
   * but the studio is always presented to visitors as "HOME INTERIOR".
   */
  name: "HOME INTERIOR",
  shortName: "HOME INTERIOR",
  monogram: "H",
  descriptor: "KARACHI — BESPOKE LIVING STUDIO",
  descriptorShort: "KARACHI",
  tagline: "Bespoke interiors, materials and architectural finishes.",
  description:
    "Bespoke interiors, architectural finishes and material specification for contemporary Karachi living.",

  phone: "03232655111",
  phoneHref: "tel:03232655111",
  /**
   * Canonical business WhatsApp. Every WhatsApp action on the site reads this
   * value — never hard-code a number inside a component.
   */
  whatsapp: "03032566212",
  whatsappUrl: `https://wa.me/923032566212`,
  whatsappUrlWithText: (text: string) => `https://wa.me/923032566212?text=${encodeURIComponent(text)}`,

  /** Structured address — one source for display, footer and schema.org. */
  address: {
    building: "BUILDING 45C, SHOP 1",
    lane: "LANE 11",
    landmark: "NEAR KABABJEES",
    area: "BADAR COMMERCIAL",
    district: "DHA PHASE 5",
    city: "KARACHI",
    region: "Sindh",
    country: "PK",
  },
  addressLines: [
    "BUILDING 45C, SHOP 1",
    "LANE 11",
    "NEAR KABABJEES",
    "BADAR COMMERCIAL",
    "DHA PHASE 5",
    "KARACHI",
  ],
  addressOneLine:
    "Building 45C, Shop 1, Lane 11, Near Kababjees, Badar Commercial, DHA Phase 5, Karachi",
  /** streetAddress value used by LocalBusiness/InteriorDesignService schema. */
  addressStreet:
    "Building 45C, Shop 1, Lane 11, Near Kababjees, Badar Commercial, DHA Phase 5",
  addressLocality: "Karachi",

  seo: {
    title: "HOME INTERIOR — Bespoke Interior Design Studio in Karachi",
    description:
      "HOME INTERIOR is a Karachi-based bespoke interior design studio offering refined residential interiors, architectural finishes, materials and turnkey design services.",
    keywords: [
      "interior design Karachi",
      "bespoke interiors",
      "SPC flooring Karachi",
      "laminate flooring Karachi",
      "wall panels",
      "gypsum ceiling design",
      "turnkey interior design",
      "DHA Phase 5 interior studio",
    ],
  },
} as const;

export type NavItem = { href: string; label: string };

/** Primary header navigation. */
export const NAV_PRIMARY: NavItem[] = [
  { href: "/", label: "HOME" },
  { href: "/philosophy", label: "PHILOSOPHY" },
  { href: "/materials", label: "MATERIALS & PRODUCTS" },
  { href: "/our-work", label: "OUR WORK" },
  { href: "/reviews", label: "CLIENT REVIEWS" },
];

/** Footer navigation group. Labels must match the header wording exactly. */
export const FOOTER_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/philosophy", label: "Philosophy" },
  { href: "/materials", label: "Materials & Products" },
  { href: "/our-work", label: "Our Work" },
  { href: "/reviews", label: "Client Reviews" },
  { href: "/services", label: "Services" },
  { href: "/consultation", label: "Consultation" },
];

/** Routes appended to the mobile drawer after the primary navigation. */
export const NAV_DRAWER_SECONDARY: NavItem[] = [
  { href: "/services", label: "SERVICES" },
];

export const NAV_CONSULTATION: NavItem = { href: "/consultation", label: "CONSULTATION" };

export const LEGAL_NAV: NavItem[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export const NAV_ALL: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/philosophy", label: "Philosophy" },
  { href: "/materials", label: "Materials & Products" },
  { href: "/our-work", label: "Our Work" },
  { href: "/reviews", label: "Client Reviews" },
  { href: "/services", label: "Services" },
  { href: "/consultation", label: "Consultation" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];




