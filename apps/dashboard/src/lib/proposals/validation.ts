import { z } from "zod";
import { PROPOSAL_SECTION_TYPES } from "./document";
export const SERVICE_UNITS = [
  "project",
  "hour",
  "month",
  "unit",
  "custom",
] as const;
export const unitLabels: Record<(typeof SERVICE_UNITS)[number], string> = {
  project: "Projeto",
  hour: "Hora",
  month: "Mês",
  unit: "Unidade",
  custom: "Personalizada",
};
const money = z
  .string()
  .trim()
  .regex(/^\d{1,12}(\.\d{1,2})?$/)
  .transform(Number);
const uuidOrEmpty = z
  .string()
  .uuid()
  .optional()
  .or(z.literal(""))
  .transform((v) => v || null);
export const serviceSchema = z.object({
  id: uuidOrEmpty,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  unit: z.enum(SERVICE_UNITS),
  price: money,
  active: z.boolean(),
});
export const proposalSchema = z.object({
  clientId: z.string().uuid(),
  opportunityId: uuidOrEmpty,
  title: z.string().trim().min(2).max(160),
  validUntil: z
    .string()
    .date()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
});
export const proposalUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  validUntil: z
    .string()
    .date()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  discount: money,
});
export const itemSchema = z
  .object({
    proposalId: z.string().uuid(),
    itemId: uuidOrEmpty,
    serviceId: uuidOrEmpty,
    name: z.string().trim().max(160),
    description: z.string().trim().max(2000).optional(),
    quantity: z
      .string()
      .regex(/^\d{1,6}(\.\d{1,3})?$/)
      .transform(Number)
      .refine((v) => v > 0),
    unit: z.enum(SERVICE_UNITS).optional(),
    unitPrice: z
      .union([money, z.literal("")])
      .optional()
      .transform((v) => (typeof v === "number" ? v : null)),
  })
  .superRefine((item, context) => {
    if (item.serviceId && !item.itemId) return;
    if (item.name.length < 2)
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "Nome inválido",
      });
    if (!item.unit)
      context.addIssue({
        code: "custom",
        path: ["unit"],
        message: "Unidade inválida",
      });
    if (item.unitPrice === null)
      context.addIssue({
        code: "custom",
        path: ["unitPrice"],
        message: "Preço inválido",
      });
  });
export const proposalFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  q: z.string().trim().max(120).optional(),
  status: z.literal("draft").optional(),
});
export const proposalSectionSchema = z.object({
  proposalId: z.string().uuid(),
  sectionId: uuidOrEmpty,
  sectionType: z.enum(PROPOSAL_SECTION_TYPES),
  title: z.string().trim().min(1).max(120),
  content: z.string().max(12000),
  visible: z.boolean(),
});
export const documentSettingsSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => v || null),
  website: z
    .string()
    .trim()
    .url()
    .max(2048)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  city: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || null),
});
export const formatMoney = (value: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
