"use client";

/**
 * components/ui/MaterialsExplorer.tsx
 *
 * Quiet-luxury catalogue browser with strict hierarchical filtering.
 * Eliminates cross-category leakage, separates Wallpaper China vs Korea,
 * and maintains synchronized URL state.
 */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MediaFrame from "./MediaFrame";
import { SITE } from "@/lib/site.config";
import type { MaterialGroup } from "@/lib/content/material-groups";
import { cx } from "@/lib/utils";

export interface ExplorerCollection {
  id: string;
  kind: "collection" | "product";
  name: string;
  href: string;
  image: string;
  parentName: string;
  groupKey: string;
  groupLabel: string;
  subKey?: string | null;
  subLabel?: string | null;
  tags: string[];
}

interface Props {
  collections: ExplorerCollection[];
  groups: MaterialGroup[];
  tags?: string[];
}

const DEBOUNCE_MS = 200;
const ALL = "all";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const term = query.trim();
  if (!term) return [{ text, hit: false }];
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "ig"));
  return parts
    .filter((part) => part !== "")
    .map((part) => ({ text: part, hit: part.toLowerCase() === term.toLowerCase() }));
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((part, index) =>
        part.hit ? (
          <mark key={index} className="mat-hit">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

export default function MaterialsExplorer({ collections, groups }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial filter parameters from URL
  const [group, setGroup] = useState<string>(() => searchParams.get("group") ?? ALL);
  const [sub, setSub] = useState<string>(() => searchParams.get("sub") ?? "");
  const [input, setInput] = useState<string>(() => searchParams.get("search") ?? "");
  const [query, setQuery] = useState<string>(input);
  const [settling, setSettling] = useState(false);

  const isFirstRender = useRef(true);
  const hasFilter = group !== ALL || sub !== "" || query.trim() !== "";

  // Debounce search query
  useEffect(() => {
    if (input === query) return;
    setSettling(true);
    const timer = window.setTimeout(() => {
      setQuery(input);
      setSettling(false);
      syncUrl({ group, sub, search: input }, "replace");
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, query]);

  // Sync state to URL with push/replace
  const syncUrl = useCallback(
    (next: { group: string; sub: string; search: string }, mode: "push" | "replace") => {
      const params = new URLSearchParams();
      if (next.group && next.group !== ALL) params.set("group", next.group);
      if (next.sub) params.set("sub", next.sub);
      const search = next.search.trim();
      if (search) params.set("search", search);

      const queryString = params.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;

      if (mode === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [pathname, router]
  );

  // Sync state on browser Back/Forward navigation
  const urlGroup = searchParams.get("group") ?? ALL;
  const urlSub = searchParams.get("sub") ?? "";
  const urlSearch = searchParams.get("search") ?? "";
  const urlSignature = `${urlGroup}|${urlSub}|${urlSearch}`;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setGroup(urlGroup);
    setSub(urlSub);
    setInput(urlSearch);
    setQuery(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSignature]);

  // Derive secondary sub-filters scoped strictly to currently selected group
  const subFilters = useMemo(() => {
    if (group === ALL) return [];

    // Wallpaper has canonical China and Korea sources
    if (group === "wallpaper") {
      return [
        { key: "china", label: "China Collections" },
        { key: "korea", label: "Korea Collections" },
      ];
    }

    // For other categories, extract distinct sub-series or collections from items in this group
    const map = new Map<string, string>();
    for (const item of collections) {
      if (item.groupKey === group && item.subKey && item.subLabel) {
        map.set(item.subKey, item.subLabel);
      }
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [collections, group]);

  // Filter visible items
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return collections.filter((item) => {
      // 1. Primary Category Filter
      if (group !== ALL && item.groupKey !== group) return false;

      // 2. Sub-filter (e.g. China vs Korea for Wallpaper)
      if (sub) {
        const matchesSubKey = item.subKey === sub;
        const matchesTags = item.tags.includes(sub);
        if (!matchesSubKey && !matchesTags) return false;
      }

      // 3. Search Term Match
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.parentName.toLowerCase().includes(term) ||
        item.groupLabel.toLowerCase().includes(term) ||
        (item.subLabel && item.subLabel.toLowerCase().includes(term)) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [collections, group, sub, query]);

  // Primary category button handler
  const handleGroup = (key: string) => {
    setGroup(key);
    // Clear sub-filters when switching category to prevent cross-category leak
    setSub("");
    syncUrl({ group: key, sub: "", search: input }, "push");
  };

  // Sub-filter button handler
  const handleSub = (key: string) => {
    const nextSub = sub === key ? "" : key;
    setSub(nextSub);
    syncUrl({ group, sub: nextSub, search: input }, "push");
  };

  // Clear all filters
  const clearAll = () => {
    setGroup(ALL);
    setSub("");
    setInput("");
    setQuery("");
    syncUrl({ group: ALL, sub: "", search: "" }, "push");
  };

  return (
    <section aria-labelledby="materials-explorer" className="pb-20">
      <h2 id="materials-explorer" className="sr-only">
        Browse and filter all collections
      </h2>

      {/* Sticky filter bar */}
      <div className="mat-filter-bar sticky top-[72px] z-30 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-editorial flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div role="search" className="mat-search-field w-full sm:max-w-sm">
              <span aria-hidden="true" className="text-[10px] uppercase tracking-[0.22em] text-muted">
                Find
              </span>
              <input
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search collections, series or keywords"
                aria-label="Search collections"
                className="mat-search-input"
              />
              {settling && (
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 animate-spin rounded-full border border-line border-t-charcoal"
                />
              )}
            </div>

            <p className="text-[11px] uppercase tracking-[0.18em] text-muted" aria-live="polite">
              {visible.length === collections.length
                ? `${visible.length} items`
                : `${visible.length} of ${collections.length} items`}
            </p>
          </div>

          {/* Primary Category Buttons (Clean quiet-luxury pills without confusing database numbers) */}
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none"
            role="group"
            aria-label="Filter by primary material category"
          >
            <button
              type="button"
              className={cx("mat-pill transition-colors", group === ALL && "bg-charcoal text-white font-medium")}
              aria-pressed={group === ALL}
              onClick={() => handleGroup(ALL)}
            >
              All Collections
            </button>
            {groups.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={cx(
                  "mat-pill transition-colors whitespace-nowrap",
                  group === entry.key && "bg-charcoal text-white font-medium"
                )}
                aria-pressed={group === entry.key}
                onClick={() => handleGroup(entry.key)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {/* Secondary Sub-Filters (Scoped strictly to the selected primary category) */}
          {subFilters.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-2 pt-1 border-t border-line/40"
              role="group"
              aria-label="Refine by series or origin"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted mr-1">
                Filter:
              </span>
              <button
                type="button"
                className={cx("mat-chip", !sub && "bg-champagne/25 text-charcoal font-semibold border-champagne")}
                aria-pressed={!sub}
                onClick={() => handleSub("")}
              >
                All {groups.find((g) => g.key === group)?.label ?? "Collections"}
              </button>
              {subFilters.map((sf) => (
                <button
                  key={sf.key}
                  type="button"
                  className={cx(
                    "mat-chip",
                    sub === sf.key && "bg-champagne/25 text-charcoal font-semibold border-champagne"
                  )}
                  aria-pressed={sub === sf.key}
                  onClick={() => handleSub(sf.key)}
                >
                  {sf.label}
                </button>
              ))}
              {hasFilter && (
                <button
                  type="button"
                  className="mat-chip text-muted hover:text-charcoal underline"
                  onClick={clearAll}
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* Direct link to dedicated category page when a category is selected */}
          {group !== ALL && (
            <div className="pt-0.5">
              <Link
                href={`/materials/${group}`}
                className="link-editorial text-xs text-champagne hover:text-gold-deep inline-flex items-center gap-1.5"
              >
                <span>Go to dedicated {groups.find((g) => g.key === group)?.label} page</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Grid of collections and items */}
      <div className={cx("mt-12 min-h-[320px]", settling && "opacity-90 transition-opacity duration-200")}>
        {visible.length === 0 ? (
          <div className="mat-skeleton rounded-card border border-line px-6 py-20 text-center">
            <p className="eyebrow">No matching materials found</p>
            <h3 className="mt-4 font-serif text-2xl leading-snug text-charcoal sm:text-3xl">
              Request a custom consultation
            </h3>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
              This studio also sources beyond the published catalogue. Tell us the finish, series or
              performance you need and we will source it for you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/consultation" className="btn btn-solid">
                Request a consultation
              </Link>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                WhatsApp the studio
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((collection) => (
              <Link
                key={collection.id}
                href={collection.href}
                className="mat-card group block rounded-card border border-line p-3 focus-visible:outline-none"
              >
                <MediaFrame
                  src={collection.image}
                  alt={`${collection.name} cover`}
                  ratio="4 / 5"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
                  className="rounded-panel"
                  imageClassName="transition-transform duration-[1200ms] ease-editorial group-hover:scale-[1.03]"
                />
                <div className="mt-5 min-h-[104px] px-1">
                  <p className="eyebrow">
                    {collection.kind === "product" ? (
                      "Product"
                    ) : (
                      <Highlighted
                        text={collection.subLabel ? `${collection.parentName} · ${collection.subLabel}` : collection.parentName}
                        query={query}
                      />
                    )}
                  </p>
                  <h3 className="mt-2 text-xl leading-snug text-charcoal">
                    <Highlighted text={collection.name} query={query} />
                  </h3>
                  <span className="link-editorial mt-3 inline-block text-champagne">
                    {collection.kind === "product" ? "View product" : "View collection"}{" "}
                    <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
