"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export default function AccountProfilePage() {
  const { user, profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await updateProfile({
        fullName,
        phone,
        address,
      });

      if (updateError) {
        setError(updateError || "Failed to update profile information.");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
        <h2 className="font-serif text-xl text-charcoal">Profile & Saved Contact Info</h2>
        <p className="mt-1 text-xs text-muted">
          Keep your contact information current so our studio specialists can reach you with project quotations and sample dispatch.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900"
          >
            Profile information updated successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="eyebrow block">
              Registered Email (Primary Key)
            </label>
            <input
              id="email"
              type="email"
              disabled
              value={user?.email || ""}
              className="mt-1.5 w-full rounded-lg border border-line bg-muted/10 px-4 py-2.5 text-sm text-muted cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-muted">
              Email addresses cannot be modified directly from this portal.
            </p>
          </div>

          <div>
            <label htmlFor="fullName" className="eyebrow block">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-champagne focus:ring-1 focus:ring-champagne"
              placeholder="e.g. Asad Siddiqui"
            />
          </div>

          <div>
            <label htmlFor="phone" className="eyebrow block">
              Phone / WhatsApp Number
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-champagne focus:ring-1 focus:ring-champagne"
              placeholder="03001234567"
            />
            <p className="mt-1 text-[11px] text-muted">
              Used to format direct WhatsApp ordering messages and order status updates.
            </p>
          </div>

          <div>
            <label htmlFor="address" className="eyebrow block">
              Default Project / Delivery Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-champagne focus:ring-1 focus:ring-champagne"
              placeholder="e.g. House 12, Street 5, DHA Phase 6, Karachi"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-charcoal px-6 py-3 text-xs uppercase tracking-widest text-canvas transition hover:bg-charcoal/90 disabled:opacity-50"
            >
              {saving ? "Saving Changes…" : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
