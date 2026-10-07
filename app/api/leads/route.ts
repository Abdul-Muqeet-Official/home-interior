/**
 * app/api/leads/route.ts
 * Receives consultation requests, validates them with Zod and stores them in Supabase.
 * Raw database errors are never returned to the browser.
 */

import { NextResponse } from "next/server";
import { createLead } from "@/lib/supabase/queries";
import { leadFieldErrors, leadSchema } from "@/lib/supabase/validateLead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Very small in-memory throttle: 6 submissions per IP per 10 minutes. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 6;
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) hits.clear();
  return recent.length > MAX_REQUESTS;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  if (isRateLimited(forwardedFor.split(",")[0].trim())) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please contact the studio on WhatsApp." },
      { status: 429 }
    );
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, fieldErrors: leadFieldErrors(parsed.error) },
      { status: 422 }
    );
  }

  const rawSource = (payload as { source?: unknown }).source;
  const source = typeof rawSource === "string" && rawSource.trim()
    ? rawSource.trim().slice(0, 60)
    : "consultation-form";

  const result = await createLead(parsed.data, source);

  if (result.ok && result.persisted) {
    return NextResponse.json({ ok: true, persisted: true }, { status: 201 });
  }

  // The visitor gets a friendly, actionable message — never a raw Supabase error.
  return NextResponse.json(
    {
      ok: false,
      persisted: false,
      message:
        "We could not record your request just now. Please contact the studio on WhatsApp and we will take your details directly.",
    },
    { status: 503 }
  );
}
