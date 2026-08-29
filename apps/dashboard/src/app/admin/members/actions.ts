"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireDashboardAccess } from "../../../lib/auth/access";
import { hasPermission } from "../../../lib/auth/permissions";
import { createClient } from "../../../lib/supabase/server";
import { recordAuditEvent } from "../../../lib/audit/record";

const inputSchema = z.object({
  membershipId: z.string().uuid(),
  roleSlug: z.enum(["administrador", "socio", "colaborador", "financeiro"]),
});

async function mutateRole(
  formData: FormData,
  operation: "assign_member_role" | "remove_member_role",
) {
  const access = await requireDashboardAccess();
  if (!(await hasPermission("roles.manage", access.organization.id))) {
    await recordAuditEvent({
      action: "permission.assignment.denied",
      outcome: "denied",
      metadata: { capability: "roles.manage" },
    });
    return;
  }
  const parsed = inputSchema.safeParse({
    membershipId: formData.get("membershipId"),
    roleSlug: formData.get("roleSlug"),
  });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc(operation, {
    target_membership_id: parsed.data.membershipId,
    target_role_slug: parsed.data.roleSlug,
  });
  if (error)
    await recordAuditEvent({
      action: "permission.assignment.denied",
      outcome: "denied",
      entityId: parsed.data.membershipId,
      entityType: "organization_member",
      metadata: { capability: "roles.manage", role: parsed.data.roleSlug },
    });
  revalidatePath("/admin/members");
}

export async function assignRole(formData: FormData) {
  await mutateRole(formData, "assign_member_role");
}
export async function removeRole(formData: FormData) {
  await mutateRole(formData, "remove_member_role");
}
