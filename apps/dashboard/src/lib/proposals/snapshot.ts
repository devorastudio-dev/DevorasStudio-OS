import { z } from "zod";

const nullableText = z.string().nullable();

export const proposalSnapshotSchema = z.object({
  proposal: z.object({
    number: z.string().min(1),
    title: z.string().min(1),
    createdAt: z.string().min(1),
    validUntil: nullableText,
    subtotal: z.coerce.number(),
    discount: z.coerce.number(),
    total: z.coerce.number(),
    sourceTemplateId: z.string().nullable().optional(),
    sourceTemplateVersion: z.number().nullable().optional(),
  }),
  organization: z.object({
    name: z.string().min(1),
    email: nullableText,
    phone: nullableText,
    website: nullableText,
    city: nullableText,
    logoPath: nullableText,
  }),
  client: z.object({ name: z.string().min(1) }),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      type: z.enum([
        "introduction",
        "objective",
        "scope",
        "deliverables",
        "technologies",
        "timeline",
        "commercial_terms",
        "notes",
        "closing",
        "custom",
      ]),
      visible: z.boolean(),
      position: z.number(),
    }),
  ),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: nullableText,
      quantity: z.coerce.number(),
      unit: z.string(),
      unitPrice: z.coerce.number(),
      total: z.coerce.number(),
    }),
  ),
});

export type ProposalSnapshot = z.infer<typeof proposalSnapshotSchema>;

export function parseProposalSnapshot(value: unknown): ProposalSnapshot {
  return proposalSnapshotSchema.parse(value);
}
