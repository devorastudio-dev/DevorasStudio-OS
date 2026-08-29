import { z } from "zod";

export const auditActions = [
  "auth.login.succeeded",
  "auth.login.failed",
  "auth.logout.succeeded",
  "auth.password_reset.requested",
  "auth.password_reset.completed",
  "auth.invitation.created",
  "auth.invitation.accepted",
  "auth.invitation.failed",
  "auth.mfa.enrollment_started",
  "auth.mfa.enrollment_completed",
  "auth.mfa.challenge.succeeded",
  "auth.mfa.challenge.failed",
  "auth.mfa.factor_added",
  "auth.mfa.factor_removed",
  "auth.access.denied",
  "member.invited",
  "member.activated",
  "member.suspended",
  "member.reactivated",
  "member.role.assigned",
  "member.role.removed",
  "permission.assignment.denied",
  "administrator.bootstrap.completed",
] as const;

export const auditActionSchema = z.enum(auditActions);
export const auditOutcomeSchema = z.enum(["success", "failure", "denied"]);
export type AuditAction = z.infer<typeof auditActionSchema>;
export type AuditOutcome = z.infer<typeof auditOutcomeSchema>;

export const auditMetadataSchema = z
  .object({
    capability: z.string().max(80).optional(),
    mode: z.enum(["invite", "recovery"]).optional(),
    role: z
      .enum(["administrador", "socio", "colaborador", "financeiro"])
      .optional(),
    source: z.enum(["dashboard", "administrative_script"]).optional(),
  })
  .strict();
