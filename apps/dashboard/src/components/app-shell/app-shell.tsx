import type { ReactNode } from "react";
import { hasPermission } from "../../lib/auth/permissions";
import type { DashboardAccess } from "../../lib/auth/access";
import { logoutAction } from "../../app/auth/actions";
import { AppShellClient } from "./app-shell-client";

export async function AppShell({
  access,
  children,
}: {
  access: DashboardAccess;
  children: ReactNode;
}) {
  const [
    crmRead,
    crmWrite,
    proposalsRead,
    proposalsWrite,
    auditRead,
    rolesRead,
  ] = await Promise.all([
    hasPermission("crm.read", access.organization.id),
    hasPermission("crm.write", access.organization.id),
    hasPermission("proposals.read", access.organization.id),
    hasPermission("proposals.write", access.organization.id),
    hasPermission("audit.read", access.organization.id),
    hasPermission("roles.read", access.organization.id),
  ]);
  return (
    <AppShellClient
      access={{
        organizationName: access.organization.name,
        profileName: access.profileName,
      }}
      permissions={{
        crmRead,
        crmWrite,
        proposalsRead,
        proposalsWrite,
        auditRead,
        rolesRead,
      }}
      logoutAction={logoutAction}
    >
      {children}
    </AppShellClient>
  );
}
