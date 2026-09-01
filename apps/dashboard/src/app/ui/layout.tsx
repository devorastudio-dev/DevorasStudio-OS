import type { ReactNode } from "react";
import { AppShell } from "../../components/app-shell/app-shell";
import { requireDashboardAccess } from "../../lib/auth/access";
export default async function UiLayout({ children }: { children: ReactNode }) {
  const access = await requireDashboardAccess();
  return <AppShell access={access}>{children}</AppShell>;
}
