import type { ReactNode } from "react";
import { AppShell } from "../../components/app-shell/app-shell";
import { requireCrmAccess } from "../../lib/crm/access";

export default async function CrmLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const access = await requireCrmAccess();
  return <AppShell access={access}>{children}</AppShell>;
}
