/**
 * components/admin/ui/Thumb.tsx
 *
 * Thumbnail renderer shared by every admin surface that previews catalogue media
 * (Media Library grid + list, collection / product / project forms, poster preview).
 *
 * These previews deliberately use a plain <img> instead of next/image: `src` is
 * operator-supplied data - a Supabase Storage public URL or a value already stored
 * in the database - and can point at a host that is not in the `images.remotePatterns`
 * allow-list in next.config.js. next/image throws on an unconfigured host, which would
 * blank out the whole admin form, while <img> merely shows a broken thumbnail. These
 * are internal-tool thumbnails rather than public LCP surfaces, so the payload/bandwidth
 * trade-off the lint rule protects does not apply here - the rule is disabled for this
 * one file and nowhere else.
 */
/* eslint-disable @next/next/no-img-element */
import { ensureAbsoluteImagePath } from "@/lib/content/image-src";

interface ThumbProps {
  src: string;
  /** Decorative previews pass "" - the surrounding table cell / card carries the meaning. */
  alt?: string;
  /** Sizing utilities from the call site (e.g. "h-16 w-16 rounded-lg object-cover"). */
  className?: string;
}

export function Thumb({ src, alt = "", className }: ThumbProps) {
  // Operator data may hold a bare storage path; sanitise before rendering so a
  // raw relative path can never reach the DOM.
  const safeSrc = ensureAbsoluteImagePath(src);
  if (!safeSrc) return null;
  return <img src={safeSrc} alt={alt} loading="lazy" decoding="async" className={className} />;
}
