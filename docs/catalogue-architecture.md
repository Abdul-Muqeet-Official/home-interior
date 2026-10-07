# HOME INTERIOR catalogue architecture

The public catalogue uses the existing Supabase `categories` and `media` tables. Do not add a second CMS schema.

## Hierarchy

`categories` represents material categories, country/group nodes, and collections. `media` represents published or draft collection assets. The public application only requests active categories and `is_published = true` media.

- Wallpaper → China/Korea → PDF-derived collection → rendered pages and derivatives
- PVC Wall Panels → evidenced series → media
- Folding Doors → Folding Door collection → images/videos
- Window Blinds → Roller Blinds collection → images
- False Ceiling → False Ceiling collection → images/video
- Artificial Grass → Artificial Grass collection → images

The local source folders are authoritative and read-only. All generated output belongs under `.catalogue-work/`.

## Import workflow

1. Run `npm run audit:sources` to inventory the current source library.
2. Run `npm run ingest:wallpapers` for the real PDF.js staging pass. It is dry-run by default.
3. Review `.catalogue-work/wallpapers/manifest.json` and per-collection manifests.
4. Deploy the reviewed additive Supabase migration.
5. Run the post-migration SELECT verification in `supabase/verification/catalogue-post-migration.sql`.
6. Run `npm run ingest:wallpapers -- --apply` only after schema, storage bucket, RLS, and public-read behaviour are verified.
7. Publish collections/media through the server-side admin API.

Apply mode never deletes existing rows, purges storage, or modifies source files.

## Duplicate handling

Every source file is hashed with SHA-256. Duplicate files are retained in the local report, but only one canonical item is eligible for publication. Source duplicates are never deleted.

## Media processing

Wallpaper PDFs are copied to private staging and rendered with `pdfjs-dist` plus `@napi-rs/canvas`. Each page receives a WebP derivative, thumbnail, dimensions, and checksum. The first rendered page is used as the deterministic cover. Embedded-image extraction is not claimed unless separately implemented and recorded.

Videos remain distinct media types and are never autoplayed. They use metadata preload and posters when available.

## Adding a new collection

1. Add the source folder to the inventory command only if it is a real approved source.
2. Add a category/collection mapping in the import manifest.
3. Run dry-run and inspect warnings, duplicates, and cross-category checks.
4. Upload/upsert only after migration verification.
5. Review the collection in admin before publishing.

## Publishing

Public publication requires the active category and published media rows. Admin mutations use the existing server-side Supabase admin client and `adminGuard`. Service-role credentials are never exposed to the browser.

## Security

Do not expose local Windows paths publicly. Validate upload MIME, file signature, extension, size, and storage path server-side. Never use public write policies as a shortcut for admin functionality. Preserve the reviews email privilege restrictions.

## Performance

Public pages are server-rendered and revalidate cached catalogue reads. `next/image` and `MediaFrame` provide responsive loading, stable aspect ratios, and lazy loading. Media galleries load the initial bounded set and should be extended with pagination/load-more for large collections. Videos use `preload="metadata"` and are not autoplayed.
