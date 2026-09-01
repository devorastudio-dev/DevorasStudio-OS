// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { pathname } = vi.hoisted(() => ({ pathname: { value: "/crm/leads" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));
import { AppShellClient } from "./app-shell-client";
const permissions = {
  crmRead: true,
  crmWrite: true,
  proposalsRead: true,
  proposalsWrite: true,
  auditRead: true,
  rolesRead: true,
};
describe("app shell", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);
  it("marks the current route and hides unauthorized groups", () => {
    render(
      <AppShellClient
        access={{
          organizationName: "Organização Teste",
          profileName: "Pessoa Teste",
        }}
        permissions={{
          ...permissions,
          proposalsRead: false,
          auditRead: false,
          rolesRead: false,
        }}
        logoutAction={vi.fn()}
      >
        <p>Conteúdo</p>
      </AppShellClient>,
    );
    expect(
      screen.getByRole("link", { name: "Leads" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.queryByRole("link", { name: "Propostas" })).toBeNull();
  });
  it("persists the collapsed desktop sidebar", async () => {
    const user = userEvent.setup();
    render(
      <AppShellClient
        access={{
          organizationName: "Organização Teste",
          profileName: "Pessoa Teste",
        }}
        permissions={permissions}
        logoutAction={vi.fn()}
      >
        <p>Conteúdo</p>
      </AppShellClient>,
    );
    await user.click(screen.getByRole("button", { name: "Recolher menu" }));
    expect(localStorage.getItem("devora-sidebar-collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: "Expandir menu" })).toBeTruthy();
  });
  it("opens and closes the accessible mobile sheet", async () => {
    const user = userEvent.setup();
    render(
      <AppShellClient
        access={{
          organizationName: "Organização Teste",
          profileName: "Pessoa Teste",
        }}
        permissions={permissions}
        logoutAction={vi.fn()}
      >
        <p>Conteúdo</p>
      </AppShellClient>,
    );
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByRole("dialog", { name: "Menu principal" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Menu principal" }),
      ).toBeNull(),
    );
  });
});
