"use client";

import { useEffect, useState } from "react";
import { CustomerRecord } from "@/app/api/admin/customers/route";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/admin/customers");
      if (!res.ok) throw new Error("Failed to load customer records");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading customers");
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      c.phone.toLowerCase().includes(term) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Studio Client Records</span>
            <span className="text-muted">/</span>
            <span className="text-xs uppercase tracking-wider text-muted">Customer CRM</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl lg:text-3xl text-charcoal">
            Clients & Accounts
          </h1>
          <p className="mt-1 text-sm text-muted">
            Directory of registered clients and ordering customers across Karachi.
          </p>
        </div>

        <input
          type="search"
          placeholder="Search name, email, phone, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-xs text-charcoal outline-none focus:border-champagne"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-card border border-line bg-surface p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h2 className="font-serif text-lg text-charcoal">
            Clients Directory ({filtered.length})
          </h2>
          <span className="text-xs text-muted">Supabase Auth + WhatsApp Enquiries</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading customer records…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">No customers found.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-muted uppercase text-[10px]">
                  <th className="pb-2">Client Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Phone / WhatsApp</th>
                  <th className="pb-2">Address / Location</th>
                  <th className="pb-2 text-center">Orders</th>
                  <th className="pb-2 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {filtered.map((c) => (
                  <tr key={c.id} className="py-3">
                    <td className="py-3 font-medium text-charcoal">
                      {c.name}
                      <span className="ml-2 inline-block rounded-full bg-sand/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted font-normal">
                        {c.source}
                      </span>
                    </td>
                    <td className="py-3 text-muted">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="hover:underline hover:text-charcoal">
                          {c.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 text-charcoal">
                      {c.phone && c.phone !== "—" ? (
                        <a
                          href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-emerald-700 font-mono"
                        >
                          {c.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 text-muted max-w-xs truncate">{c.address || "—"}</td>
                    <td className="py-3 text-center font-semibold text-charcoal">{c.orderCount}</td>
                    <td className="py-3 text-right text-muted">
                      {new Date(c.lastActive).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

