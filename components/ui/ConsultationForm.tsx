"use client";

/**
 * components/ui/ConsultationForm.tsx
 * Consultation request form.
 * Validation is shared with the server (Zod), the request is posted to /api/leads
 * which writes into Supabase `leads`, and raw database errors are never surfaced —
 * the visitor only ever sees a friendly message plus a WhatsApp fallback.
 */

import { useState } from "react";
import { CONSULTATION } from "@/lib/content/editorial";
import { SITE } from "@/lib/site.config";
import { leadFieldErrors, leadSchema, type LeadFieldErrors } from "@/lib/supabase/validateLead";
import { cx } from "@/lib/utils";

type FormState = {
  name: string;
  phone: string;
  email: string;
  projectType: string;
  preferredContact: string;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  phone: "",
  email: "",
  projectType: CONSULTATION.projectTypes[0],
  preferredContact: CONSULTATION.contactMethods[0],
  message: "",
};

export default function ConsultationForm({ source = "consultation-page" }: { source?: string }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<LeadFieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [note, setNote] = useState<string | null>(null);

  const update = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = leadSchema.safeParse({
      name: form.name,
      phone: form.phone,
      email: form.email,
      projectType: form.projectType || undefined,
      preferredContact: form.preferredContact || undefined,
      message: form.message.trim() || undefined,
    });

    if (!parsed.success) {
      setErrors(leadFieldErrors(parsed.error));
      setStatus("error");
      setNote("Please review the highlighted fields.");
      return;
    }

    setStatus("submitting");
    setErrors({});
    setNote(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, source }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; fieldErrors?: Record<string, string> }
        | null;

      if (response.ok && payload?.ok) {
        setStatus("success");
        return;
      }

      if (payload?.fieldErrors) {
        setErrors(payload.fieldErrors as LeadFieldErrors);
        setStatus("error");
        setNote("Please review the highlighted fields.");
        return;
      }

      setStatus("error");
      setNote(
        "We could not record your request just now. Please send it on WhatsApp or call the studio and we will pick it up straight away."
      );
    } catch {
      setStatus("error");
      setNote(
        "Your connection dropped while sending. Please try again, or reach the studio directly on WhatsApp."
      );
    }
  };

  const fieldClass = (key: keyof FormState) => cx("field-input", errors[key] && "border-danger");

  if (status === "success") {
    return (
      <div className="card-surface px-8 py-14 text-center sm:px-12">
        <p className="eyebrow text-champagne">Request received</p>
        <h3 className="display-3 mt-5 text-charcoal">
          Thank you{form.name ? `, ${form.name.split(" ")[0]}` : ""}.
        </h3>
        <p className="lede mx-auto mt-5 max-w-md">
          Your consultation request is with the studio. Private enquiries are answered within one
          working day.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-glass-dark">
            CONTINUE ON WHATSAPP
            <span aria-hidden="true">→</span>
          </a>
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL);
              setStatus("idle");
              setNote(null);
            }}
            className="btn btn-outline"
          >
            SEND ANOTHER REQUEST
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="lead-name">
            Name
          </label>
          <input
            id="lead-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "lead-name-error" : undefined}
            className={fieldClass("name")}
            placeholder="Your full name"
          />
          {errors.name && (
            <p id="lead-name-error" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="lead-phone">
            Phone
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "lead-phone-error" : undefined}
            className={fieldClass("phone")}
            placeholder="03232655111"
          />
          {errors.phone && (
            <p id="lead-phone-error" className="field-error">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="lead-email">
          Email
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "lead-email-error" : undefined}
          className={fieldClass("email")}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="lead-email-error" className="field-error">
            {errors.email}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="lead-project-type">
            Project type
          </label>
          <select
            id="lead-project-type"
            name="projectType"
            value={form.projectType}
            onChange={(event) => update("projectType", event.target.value)}
            className="field-input"
          >
            {CONSULTATION.projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="field-label">Preferred contact method</legend>
          <div className="flex flex-wrap gap-3 pt-1">
            {CONSULTATION.contactMethods.map((method) => (
              <label
                key={method}
                className={cx(
                  "cursor-pointer rounded-full border px-4 py-2 text-xs transition-colors",
                  form.preferredContact === method
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-line-strong text-muted hover:border-charcoal hover:text-charcoal"
                )}
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value={method}
                  checked={form.preferredContact === method}
                  onChange={(event) => update("preferredContact", event.target.value)}
                  className="sr-only"
                />
                {method}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label className="field-label" htmlFor="lead-message">
          Message
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={5}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "lead-message-error" : undefined}
          className={fieldClass("message")}
          placeholder="Rooms involved, approximate area, timeline and any material preferences."
        />
        {errors.message && (
          <p id="lead-message-error" className="field-error">
            {errors.message}
          </p>
        )}
      </div>

      {status === "error" && note && (
        <p
          role="alert"
          className="rounded-panel border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {note}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" className="btn btn-glass-dark" disabled={status === "submitting"}>
          {status === "submitting" ? "SENDING…" : "REQUEST A CONSULTATION"}
          {status === "submitting" ? null : <span aria-hidden="true">→</span>}
        </button>
        <a
          href={SITE.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          WHATSAPP
        </a>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Your details are used only to arrange this consultation and are stored securely in the
        studio’s Supabase lead register. See our{" "}
        <a href="/privacy" className="underline hover:text-charcoal">
          privacy notice
        </a>
        .
      </p>
    </form>
  );
}

