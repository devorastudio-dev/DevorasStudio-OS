import { z } from "zod";

export const serviceInterests = [
  "digital_presence",
  "business_systems",
  "automation",
  "other",
] as const;

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null);

export const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: optionalText(30).refine(
    (value) => value === null || /^[0-9+(). -]{7,30}$/.test(value),
    "Informe um telefone válido.",
  ),
  company: optionalText(160),
  serviceInterest: z.enum(serviceInterests),
  message: z.string().trim().min(20).max(2000),
  consent: z.literal("on"),
  landingPath: z.string().regex(/^\/(?!.*[?#]).{0,199}$/),
  utmSource: optionalText(120),
  utmMedium: optionalText(120),
  utmCampaign: optionalText(120),
  utmContent: optionalText(120),
  utmTerm: optionalText(120),
});

export type LeadInput = z.infer<typeof leadSchema>;

export type SubmissionTiming = "valid" | "missing_or_invalid" | "too_fast";

export function evaluateSubmissionTiming(
  startedAt: string,
  now = Date.now(),
): SubmissionTiming {
  const start = Number(startedAt);
  if (!startedAt || !Number.isFinite(start) || start <= 0 || start > now)
    return "missing_or_invalid";
  return now - start < 2_000 ? "too_fast" : "valid";
}
