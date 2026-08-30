import { z } from "zod";
import { LOSS_REASONS } from "./pipeline";

const optionalMoney = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value.replace(",", ".")) : null))
  .pipe(z.number().min(0).max(999999999999.99).nullable());

export const createOpportunitySchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().trim().min(2).max(160).optional().or(z.literal("")),
  estimatedValue: optionalMoney,
});

export const moveOpportunitySchema = z
  .object({
    opportunityId: z.string().uuid(),
    stageId: z.string().uuid(),
    version: z.coerce.number().int().positive(),
    lossReason: z.enum(LOSS_REASONS).optional().or(z.literal("")),
    lossDetail: z.string().trim().max(240).optional(),
  })
  .superRefine((value, context) => {
    if (value.lossReason === "other" && (value.lossDetail?.length ?? 0) < 3)
      context.addIssue({
        code: "custom",
        path: ["lossDetail"],
        message: "Descreva o motivo.",
      });
  });

export const updateOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  version: z.coerce.number().int().positive(),
  title: z.string().trim().min(2).max(160),
  estimatedValue: optionalMoney,
  assignedMembershipId: z.string().uuid().optional().or(z.literal("")),
  archived: z.boolean(),
});

export const pipelineFiltersSchema = z.object({
  stage: z.string().uuid().optional(),
  assignee: z.string().uuid().optional(),
  category: z.enum(["open", "won", "lost"]).optional(),
});
