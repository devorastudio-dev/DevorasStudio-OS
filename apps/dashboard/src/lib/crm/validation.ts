import { z } from "zod";
import { CRM_SOURCES, CRM_TRIAGE } from "./constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);
const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);
const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[0-9+(). -]*$/)
  .optional()
  .transform((value) => value || null);
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || null);

export const crmFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  q: z
    .string()
    .trim()
    .max(120)
    .regex(/^[\p{L}\p{N}@+. _-]+$/u)
    .optional(),
  source: z.enum(CRM_SOURCES).optional(),
  triage: z.enum(CRM_TRIAGE).optional(),
  state: z.enum(["active", "archived"]).optional(),
  assignee: z.string().uuid().optional(),
  company: z.string().uuid().optional(),
});

export const leadSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: optionalEmail,
    phone,
    companyText: optionalText(160),
    serviceInterest: z.enum([
      "digital_presence",
      "business_systems",
      "automation",
      "other",
    ]),
    message: z.string().trim().min(20).max(2000),
    source: z.enum(CRM_SOURCES),
    sourceDetail: optionalText(120),
    assignedMembershipId: optionalUuid,
    companyId: optionalUuid,
    contactId: optionalUuid,
  })
  .superRefine((value, context) => {
    if (value.source === "other" && !value.sourceDetail)
      context.addIssue({
        code: "custom",
        path: ["sourceDetail"],
        message: "Descreva a origem.",
      });
    if (value.source !== "other" && value.sourceDetail)
      context.addIssue({
        code: "custom",
        path: ["sourceDetail"],
        message: "Origem complementar inesperada.",
      });
  });

export const companySchema = z
  .object({
    displayName: z.string().trim().min(1).max(160),
    website: z
      .string()
      .trim()
      .url()
      .max(2048)
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email()
      .max(254)
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    phone,
    source: z
      .enum(CRM_SOURCES)
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    sourceDetail: optionalText(120),
    notes: optionalText(1000),
  })
  .superRefine((value, context) => {
    if (value.source === "other" && !value.sourceDetail)
      context.addIssue({
        code: "custom",
        path: ["sourceDetail"],
        message: "Descreva a origem.",
      });
    if (value.source !== "other" && value.sourceDetail)
      context.addIssue({
        code: "custom",
        path: ["sourceDetail"],
        message: "Origem complementar inesperada.",
      });
  });

export const contactSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email()
      .max(254)
      .optional()
      .or(z.literal(""))
      .transform((v) => v || null),
    phone,
    jobTitle: optionalText(120),
    companyId: optionalUuid,
    isPrimary: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.isPrimary && !value.companyId)
      context.addIssue({
        code: "custom",
        path: ["companyId"],
        message: "Contato principal exige empresa.",
      });
  });

export const leadUpdateSchema = z
  .object({
    id: z.string().uuid(),
    version: z.coerce.number().int().positive(),
    fullName: z.string().trim().min(2).max(120),
    email: optionalEmail,
    phone,
    companyText: optionalText(160),
    serviceInterest: z.enum([
      "digital_presence",
      "business_systems",
      "automation",
      "other",
    ]),
    message: z.string().trim().min(20).max(2000),
    source: z.enum(CRM_SOURCES),
    sourceDetail: optionalText(120),
    triageStatus: z.enum(CRM_TRIAGE),
    disqualificationReason: optionalText(500),
    assignedMembershipId: optionalUuid,
    companyId: optionalUuid,
    contactId: optionalUuid,
    archived: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.source === "other" && !value.sourceDetail)
      context.addIssue({
        code: "custom",
        path: ["sourceDetail"],
        message: "Descreva a origem.",
      });
    if (value.source !== "other" && value.sourceDetail)
      context.addIssue({
        code: "custom",
        path: ["sourceDetail"],
        message: "Origem complementar inesperada.",
      });
    if (
      value.triageStatus === "disqualified" &&
      (!value.disqualificationReason || value.disqualificationReason.length < 3)
    )
      context.addIssue({
        code: "custom",
        path: ["disqualificationReason"],
        message: "Informe o motivo.",
      });
    if (value.triageStatus !== "disqualified" && value.disqualificationReason)
      context.addIssue({
        code: "custom",
        path: ["disqualificationReason"],
        message: "Motivo permitido somente na desqualificação.",
      });
  });

export function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
