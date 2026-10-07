// components/ui/Logo.tsx
// Dedicated Logo component using next/image
// Renders the official HOME INTERIOR logo with responsive widths.

"use client";

import Image from "next/image";
import { SITE } from "@/lib/site.config";

export default function Logo({ alt = `${SITE.name} logo` }: { alt?: string }) {
  // The surrounding container sizes the logo; the image fills it with
  // object-contain so the 448x376 artwork is never cropped or distorted.
  return (
    <Image
      src="/brand/logo.png"
      alt={alt}
      width={448}
      height={376}
      className="block h-full w-full object-contain"
      priority
    />
  );
}

