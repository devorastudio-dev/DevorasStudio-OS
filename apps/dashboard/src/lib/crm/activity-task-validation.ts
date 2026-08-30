import { z } from "zod";
import { ACTIVITY_TYPES } from "./activity-task";
const uuidOrEmpty = z.string().uuid().optional().or(z.literal(""));
const localDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .transform((value) => new Date(`${value}:00-03:00`).toISOString());
const links = {
  leadId: uuidOrEmpty,
  opportunityId: uuidOrEmpty,
  companyId: uuidOrEmpty,
  contactId: uuidOrEmpty,
};
export const activitySchema = z
  .object({
    activityType: z.enum(ACTIVITY_TYPES),
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(2000).optional(),
    occurredAt: localDate,
    assignedMembershipId: z.string().uuid(),
    returnTo: z.string(),
    ...links,
  })
  .refine((v) => v.leadId || v.opportunityId, {
    message: "Vincule um lead ou oportunidade.",
  });
export const taskSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(1000).optional(),
    dueAt: localDate,
    assignedMembershipId: z.string().uuid(),
    returnTo: z.string(),
    ...links,
  })
  .refine((v) => v.leadId || v.opportunityId || v.companyId || v.contactId, {
    message: "Vincule uma entidade.",
  });
export const taskTransitionSchema = z.object({
  taskId: z.string().uuid(),
  version: z.coerce.number().int().positive(),
  status: z.enum(["pending", "completed", "cancelled"]),
  returnTo: z.string(),
});
export const taskFiltersSchema = z.object({
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  due: z.enum(["overdue", "today", "upcoming"]).optional(),
  assignee: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});
export function safeCrmReturn(value: string) {
  return /^\/crm\/(tasks|(leads|opportunities|companies|contacts)\/[0-9a-f-]{36})$/.test(
    value,
  )
    ? value
    : "/crm/tasks";
}
