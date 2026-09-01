// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { hasPermission } = vi.hoisted(() => ({ hasPermission: vi.fn() }));
vi.mock("../lib/auth/access", () => ({
  requireDashboardAccess: async () => ({
    organization: {
      id: "10000000-0000-4000-8000-000000000001",
      name: "Organizacao Ficticia",
      slug: "ficticia",
    },
    profileName: "Pessoa Ficticia",
    user: { id: "10000000-0000-4000-8000-000000000011" },
  }),
}));
vi.mock("../lib/auth/permissions", () => ({ hasPermission }));
vi.mock("../lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async () => ({
      data: { activeLeads: 2, openOpportunities: 1 },
      error: null,
    }),
  }),
}));
vi.mock("../lib/proposals/db", () => ({
  createProposalsDb: async () => ({
    from: () => ({
      select: () => ({ eq: () => ({ eq: async () => ({ data: [] }) }) }),
    }),
  }),
}));
vi.mock("../components/app-shell/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
import DashboardHome from "./page";
describe("navegacao do CRM", () => {
  beforeEach(() => hasPermission.mockReset());
  afterEach(cleanup);
  it("mostra CRM somente com crm.read", async () => {
    hasPermission.mockImplementation(async (key: string) => key === "crm.read");
    render(await DashboardHome());
    expect(
      screen.getByRole("link", { name: /Leads ativos/ }).getAttribute("href"),
    ).toBe("/crm/leads");
  });
  it("oculta CRM sem crm.read", async () => {
    hasPermission.mockResolvedValue(false);
    render(await DashboardHome());
    expect(screen.queryByRole("link", { name: /Leads ativos/ })).toBeNull();
  });
});
