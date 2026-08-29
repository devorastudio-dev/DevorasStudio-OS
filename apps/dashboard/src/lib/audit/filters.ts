import { z } from "zod";

const date = z.string().date();
export const auditFiltersSchema = z
  .object({
    action: z
      .string()
      .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,3}$/)
      .optional(),
    actor: z.string().uuid().optional(),
    entity: z.string().uuid().optional(),
    from: date.optional(),
    outcome: z.enum(["success", "failure", "denied"]).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    to: date.optional(),
  })
  .superRefine((value, context) => {
    if (value.from && value.to) {
      const days = (Date.parse(value.to) - Date.parse(value.from)) / 86_400_000;
      if (days < 0 || days > 90)
        context.addIssue({ code: "custom", message: "Periodo invalido." });
    }
  });

export function parseAuditFilters(
  input: Record<string, string | string[] | undefined>,
) {
  return auditFiltersSchema.safeParse(input);
}
