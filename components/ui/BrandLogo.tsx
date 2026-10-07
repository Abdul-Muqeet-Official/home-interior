/**
 * components/ui/BrandLogo.tsx
 * The client-provided gold-on-white brand mark, used at its trimmed native
 * proportions (392x320). Never redrawn, recoloured or distorted.
 */

import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  className = "h-11 w-auto",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/brand/logo.png"
      alt="HOME INTERIOR — Interior & Designs"
      width={392}
      height={320}
      priority={priority}
      className={className}
    />
  );
}