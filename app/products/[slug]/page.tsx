/**
 * app/products/[slug]/page.tsx
 * Product detail: gallery, specification, price status and consultation actions.
 * Content comes from Supabase only — nothing is invented, and pricing is shown only
 * when the record actually carries it.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ProductGallery from "@/components/ui/ProductGallery";
import ProductGrid from "@/components/ui/ProductGrid";
import StockBadge from "@/components/ui/StockBadge";
import { ProductDimensionsTable } from "@/components/ui/ProductDimensions";
import Reveal from "@/components/ui/Reveal";
import { getProductBySlug, getRelatedProducts } from "@/lib/supabase/queries";
import { EMPTY_STATES } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.name}${product.code ? ` (${product.code})` : ""}`,
    description:
      product.description ??
      `${product.name} from the ${product.categoryName} collection at HOME INTERIOR, Karachi.`,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 3);
  const galleryImages = product.gallery;
  const productAlt = `${product.name}${product.code ? ` (${product.code})` : ""}`;
  const whatsappHref = SITE.whatsappUrlWithText(
    `Hello ${SITE.name}, I would like to enquire about ${product.name}${
      product.code ? ` (${product.code})` : ""
    }.`
  );

  return (
    <main id="main">
      <section className="pb-10 pt-12">
        <div className="container-wide">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Materials & Products", href: "/materials" },
              { label: product.categoryName, href: `/materials/${product.categorySlug}` },
              { label: product.name },
            ]}
          />
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <ProductGallery
              cover={product.image}
              images={galleryImages}
              alt={productAlt}
              sizes="(max-width: 1024px) 92vw, 720px"
            />
          </Reveal>

          <Reveal className="lg:col-span-5" delayMs={80}>
            <p className="eyebrow">
              {product.categoryName}
              {product.code ? <span className="text-champagne"> · {product.code}</span> : null}
            </p>
            <h1 className="display-2 mt-5 text-charcoal">{product.name}</h1>

            {product.description && <p className="lede mt-6">{product.description}</p>}

            {product.stockStatus && (
              <div className="mt-8">
                <StockBadge status={product.stockStatus} className="px-3 py-1.5" />
              </div>
            )}

            <div className={product.stockStatus ? "mt-6 flex flex-wrap items-baseline gap-4" : "mt-8 flex flex-wrap items-baseline gap-4"}>
              {product.priceLabel ? (
                <>
                  <span className="font-serif text-2xl text-charcoal">{product.priceLabel}</span>
                  {product.originalPriceLabel && (
                    <span className="text-sm text-muted line-through">
                      {product.originalPriceLabel}
                    </span>
                  )}
                  {product.badge && (
                    <span className="rounded-full border border-champagne px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold-deep">
                      {product.badge}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs uppercase tracking-[0.22em] text-muted">
                  {EMPTY_STATES.pricing.priceOnConsultation}
                </span>
              )}
            </div>
            {product.priceLabel && (
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Listed price is indicative and confirmed against the current stock and quantity
                requirement.
              </p>
            )}

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/consultation" className="btn btn-solid">
                REQUEST A CONSULTATION
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                WHATSAPP
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-pure" aria-labelledby="product-specification">
        <div className="container-wide grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow">Specification</p>
            <h2 id="product-specification" className="display-3 mt-4 text-charcoal">
              Technical notes
            </h2>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Data below is taken directly from the product record. Full technical data sheets,
              warranty terms and installation guidance are issued with every quotation.
            </p>
          </div>

          <div className="lg:col-span-8">
              {product.specs.length > 0 || product.dimensions ? (
                <>
                  {/* Dimensions lead the table; the table renders nothing when unstated. */}
                  <ProductDimensionsTable dimensions={product.dimensions} />
                  {product.specs.length > 0 && (
                    <dl className="border-t border-line">
                      {product.specs.map((spec) => (
                        <div
                          key={`${spec.label}-${spec.value}`}
                          className="grid grid-cols-1 gap-2 border-b border-line py-4 sm:grid-cols-3"
                        >
                          <dt className="text-[11px] uppercase tracking-[0.22em] text-muted">
                            {spec.label}
                          </dt>
                          <dd className="text-sm text-charcoal sm:col-span-2">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </>
              ) : (
              <div className="rounded-card border border-line bg-canvas px-8 py-12 text-center">
                <p className="eyebrow">Specification sheet</p>
                <p className="lede mx-auto mt-4 max-w-md">
                  A detailed specification sheet for this product is issued at consultation, together
                  with sample availability and lead time.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/consultation" className="btn btn-solid">
                    REQUEST SPECIFICATION
                    <span aria-hidden="true">→</span>
                  </Link>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    WHATSAPP
                  </a>
                </div>
              </div>
            )}

            <dl className="mt-10 grid gap-8 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">Collection</dt>
                <dd className="mt-2 text-sm text-charcoal">{product.categoryName}</dd>
              </div>
              <div>
                <dt className="eyebrow">Product code</dt>
                <dd className="mt-2 text-sm text-charcoal">{product.code ?? "Issued on request"}</dd>
              </div>
              <div>
                <dt className="eyebrow">Availability</dt>
                <dd className="mt-2 text-sm text-charcoal">
                  {product.stockStatus === "in_stock" && "Available"}
                  {product.stockStatus === "out_of_stock" && "Out of stock"}
                  {!product.stockStatus && "Confirmed at consultation"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" aria-labelledby="related-collection">
          <div className="container-wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 id="related-collection" className="display-3 text-charcoal">
                Related collection
              </h2>
              <Link href={`/materials/${product.categorySlug}`} className="link-editorial">
                All {product.categoryName}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ProductGrid products={related} columns={3} className="mt-12" />
          </div>
        </section>
      )}

      <section className="section-tight pb-20">
        <div className="container-wide">
          <div className="rounded-card border border-line bg-surface px-8 py-12 text-center sm:px-14">
            <p className="eyebrow">Next step</p>
            <h2 className="display-3 mt-4 text-charcoal">
              Specify this finish in your project.
            </h2>
            <p className="lede mx-auto mt-4 max-w-xl">
              Send us the room, approximate area and your timeline. We will confirm availability,
              pricing and installation sequencing.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/consultation" className="btn btn-solid">
                REQUEST A CONSULTATION
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                WHATSAPP
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
