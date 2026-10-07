/**
 * lib/supabase/validateLead.ts
 * Zod validation for lead submissions. Shared by the consultation form and the
 * `/api/leads` route so the client and the server enforce identical rules.
 */

import { z } from "zod";

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short")
    .max(25, "Phone number is too long")
    .regex(/^\+?[0-9\s()-]{7,25}$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .min(5, "Enter a valid email address")
    .max(150, "Email is too long")
    .email("Enter a valid email address"),
  projectType: z.string().trim().max(60, "Project type is too long").optional(),
  preferredContact: z
    .enum(["WhatsApp", "Phone call", "Email"])
    .optional(),
  message: z.string().trim().max(1000, "Please keep your message under 1000 characters").optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Field-keyed error map for form rendering. */
export type LeadFieldErrors = Partial<Record<keyof LeadInput | "form", string>>;

/** Safe parse — never throws. */
export function validateLead(payload: unknown) {
  return leadSchema.safeParse(payload);
}

/** Throwing parse for callers that prefer exceptions. */
export function parseLead(payload: unknown): LeadInput {
  return leadSchema.parse(payload);
}

export function leadFieldErrors(error: z.ZodError): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  for (const issue of error.issues) {
    const key = (issue.path[0] as keyof LeadInput | undefined) ?? "form";
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
