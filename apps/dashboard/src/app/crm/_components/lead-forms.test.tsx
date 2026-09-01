// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadCreateForm, LeadUpdateForm } from "./forms";

afterEach(cleanup);
const action = vi.fn();
const baseLead = {
  id: "11111111-1111-4111-8111-111111111111",
  version: 1,
  full_name: "Lead sem email",
  email: null,
  phone: "11999999999",
  company: "Empresa",
  service_interest: "automation",
  message: "Contexto comercial suficientemente detalhado.",
  source: "instagram",
  source_detail: null,
  triage_status: "new",
  disqualification_reason: null,
  assigned_membership_id: null,
  company_id: null,
  contact_id: null,
  archived_at: null,
};

describe("lead forms", () => {
  it("allows a manual lead without email and validates invalid email", async () => {
    const user = userEvent.setup();
    render(
      <LeadCreateForm
        action={action}
        members={[]}
        companies={[]}
        contacts={[]}
      />,
    );
    const email = screen.getByLabelText("E-mail (opcional)");
    expect(email).not.toBeRequired();
    await user.type(email, "invalid");
    expect(email).toBeInvalid();
  });

  it("loads data, allows adding/removing email and offers cancel", async () => {
    const user = userEvent.setup();
    render(
      <LeadUpdateForm
        action={action}
        lead={baseLead}
        members={[]}
        companies={[]}
        contacts={[]}
      />,
    );
    expect(screen.getByLabelText("Nome completo")).toHaveValue(
      "Lead sem email",
    );
    const email = screen.getByLabelText("E-mail (opcional)");
    await user.type(email, "lead@example.invalid");
    expect(email).toHaveValue("lead@example.invalid");
    await user.clear(email);
    expect(email).toHaveValue("");
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
      "href",
      `/crm/leads/${baseLead.id}`,
    );
  });
});
