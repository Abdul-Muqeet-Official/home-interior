"use client";

/**
 * components/ui/SearchOverlay.tsx
 * Accessible search dialog over the real published catalogue
 * (materials, products, projects, services). No invented results.
 */

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { SITE } from "@/lib/site.config";
import type { SearchResult } from "@/lib/content/types";

const GROUP_ORDER: SearchResult["group"][] = ["Materials", "Collections", "Products", "Our Work", "Services"];

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  /** Curated, real destinations fetched the moment the overlay opens. */
  const [recommended, setRecommended] = useState<SearchResult[]>([]);

  /*
   * Recommendations are fetched once per open, BEFORE the user types, so the
   * overlay is never empty. Every entry comes from live published catalogue rows.
   */
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/search?recommended=1", { signal: controller.signal });
        if (res.ok) {
          const data: unknown = await res.json();
          setRecommended(Array.isArray(data) ? (data as SearchResult[]) : []);
        }
      } catch (err) {
        // Abort on close is expected; any other failure simply leaves it empty.
        if ((err as Error)?.name !== "AbortError") setRecommended([]);
      }
    })();

    return () => controller.abort();
  }, [open]);


  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data: unknown = await res.json();
          setResults(Array.isArray(data) ? (data as SearchResult[]) : []);
        } else {
          setResults([]);
        }
      } catch (err) {
        // A superseded keystroke or a closing overlay is normal, not an error.
        if ((err as Error)?.name === "AbortError") return;
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: results.filter((result) => result.group === group),
  })).filter((entry) => entry.items.length > 0);

  /** Same grouping for the pre-typing recommendations. */
  const recommendedGrouped = GROUP_ORDER.map((group) => ({
    group,
    items: recommended.filter((result) => result.group === group),
  })).filter((entry) => entry.items.length > 0);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const moveFocus = (direction: 1 | -1) => {
    const nodes = linkRefs.current.filter((node): node is HTMLAnchorElement => Boolean(node));
    if (nodes.length === 0) return;
    const currentIndex = nodes.findIndex((node) => node === document.activeElement);
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : nodes.length - 1
        : (currentIndex + direction + nodes.length) % nodes.length;
    nodes[nextIndex].focus();
  };

  if (!open) return null;

  let cursorValue = 0;

  return (
    <div className="fixed inset-0 z-[70] flex justify-center px-4 pt-[8vh] sm:pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-charcoal/70"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-search-title"
        className="relative z-10 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-card border border-line bg-pure shadow-lift flex flex-col"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveFocus(1);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveFocus(-1);
          }
        }}
      >
        <div className="flex items-center gap-4 border-b border-line px-6 py-5 shrink-0">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-muted" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="11" cy="11" r="7" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeWidth={1.5} d="M20 20l-3.5-3.5" />
          </svg>
          <h2 id="site-search-title" className="sr-only">
            Search HOME INTERIOR
          </h2>
          <input
            id="site-search-input"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search materials, products, projects..."
            aria-label="Search HOME INTERIOR"
            autoComplete="off"
            className="w-full bg-transparent text-base text-charcoal outline-none placeholder:text-muted/70"
          />
          {loading && (
             <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-transparent"></div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:border-charcoal hover:text-charcoal whitespace-nowrap ml-2 shrink-0"
          >
            Esc
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex-1 min-h-0">
          {query.trim().length > 0 && results.length === 0 && !loading ? (
            <div className="py-6 text-center">
              <p className="text-sm text-charcoal">
                Nothing matches &quot;{query}&quot; in the published catalogue.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Try a material such as &quot;SPC&quot;, &quot;wallpaper&quot; or &quot;ceiling&quot;, or request a consultation
                on WhatsApp.
              </p>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-solid mt-6"
              >
                Start on WhatsApp
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          ) : query.trim().length === 0 ? (
            recommendedGrouped.length === 0 ? (
              <div className="py-8 text-center text-muted">
                <p className="text-sm">Loading recommendations...</p>
              </div>
            ) : (
              <>
                <h3 className="eyebrow mb-4">Recommended</h3>
                {recommendedGrouped.map((entry) => (
                  <section key={entry.group} className="mb-6 last:mb-0">
                    <h3 className="eyebrow mb-3">{entry.group}</h3>
                    <ul className="space-y-1">
                      {entry.items.map((result) => {
                        const index = cursorValue++;
                        return (
                          <li key={`${result.group}-${result.href}-${result.title}`}>
                            <Link
                              href={result.href}
                              ref={(node) => {
                                linkRefs.current[index] = node;
                              }}
                              onClick={onClose}
                              className="flex items-center justify-between gap-4 rounded-panel px-3 py-3 transition-colors hover:bg-surface focus-visible:bg-surface"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm text-charcoal">
                                  {result.title}
                                </span>
                                {result.subtitle && (
                                  <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.16em] text-muted">
                                    {result.subtitle}
                                  </span>
                                )}
                              </span>
                              <span aria-hidden="true" className="text-champagne">
                                &rarr;
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </>
            )
          ) : (
            grouped.map((entry) => (
              <section key={entry.group} className="mb-6 last:mb-0">
                <h3 className="eyebrow mb-3">{entry.group}</h3>
                <ul className="space-y-1">
                  {entry.items.map((result) => {
                    const index = cursorValue++;
                    return (
                      <li key={`${result.group}-${result.href}-${result.title}`}>
                        <Link
                          href={result.href}
                          ref={(node) => {
                            linkRefs.current[index] = node;
                          }}
                          onClick={onClose}
                          className="flex items-center justify-between gap-4 rounded-panel px-3 py-3 transition-colors hover:bg-surface focus-visible:bg-surface"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-charcoal">
                              {result.title}
                            </span>
                            {result.subtitle && (
                              <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.16em] text-muted">
                                {result.subtitle}
                              </span>
                            )}
                          </span>
                          <span aria-hidden="true" className="text-champagne">
                            &rarr;
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

