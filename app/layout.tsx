/**
 * app/layout.tsx
 * Root layout: fonts, metadata, structured data, header and footer.
 */

import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import WhatsAppFloat from "@/components/ui/WhatsAppFloat";
import AppProviders from "@/components/providers/AppProviders";
import { SITE, SITE_URL } from "@/lib/site.config";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  icons: { icon: "/brand/favicon-64.png", apple: "/brand/apple-icon-180.png" },
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.seo.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.seo.description,
  keywords: [...SITE.seo.keywords],
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE.name,
    locale: "en_PK",
    title: SITE.seo.title,
    description: SITE.seo.description,
    images: [
      {
        url: "/media/og.svg",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.descriptor}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.seo.title,
    description: SITE.seo.description,
    images: ["/media/og.svg"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

/** Verified business facts only — no awards, ratings or invented claims. */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "InteriorDesignService",
  name: SITE.name,
  slogan: SITE.tagline,
  description: SITE.seo.description,
  url: SITE_URL,
  telephone: SITE.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.addressStreet,
    addressLocality: SITE.addressLocality,
    addressRegion: SITE.address.region,
    addressCountry: SITE.address.country,
  },
  areaServed: { "@type": "City", name: SITE.addressLocality },
  knowsAbout: [
    "Interior architecture",
    "Residential interior design",
    "SPC and laminate flooring",
    "Wall panels and wallpaper",
    "Gypsum ceiling design",
    "Turnkey project management",
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-canvas font-sans text-charcoal antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-charcoal focus:px-5 focus:py-3 focus:text-[11px] focus:uppercase focus:tracking-[0.2em] focus:text-white"
        >
          Skip to content
        </a>
        <AppProviders>
          <Header />
          {children}
          <WhatsAppFloat />
          <Footer />
        </AppProviders>
        <script
          type="application/ld+json"
          // Static, verified business data.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}


