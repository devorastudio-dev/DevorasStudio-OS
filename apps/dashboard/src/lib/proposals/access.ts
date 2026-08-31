import { redirect } from "next/navigation";
import { recordAuditEvent } from "../audit/record";
import { requireDashboardAccess } from "../auth/access";
import { hasPermission } from "../auth/permissions";
export async function requireProposalsAccess(
  capability: "proposals.read" | "proposals.write" = "proposals.read",
) {
  const access = await requireDashboardAccess();
  if (!(await hasPermission(capability, access.organization.id))) {
    await recordAuditEvent({
      action: "auth.access.denied",
      outcome: "denied",
      metadata: { capability },
    });
    redirect("/");
  }
  return access;
}
