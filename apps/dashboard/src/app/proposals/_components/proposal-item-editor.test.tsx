// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { saveProposalItem } from "../../../lib/proposals/actions";
import { ProposalItemEditor } from "./proposal-item-editor";

vi.mock("../../../lib/proposals/actions", () => ({
  saveProposalItem: vi.fn(async () => undefined),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const catalogItem = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Diagnóstico",
  description: "Snapshot original",
  quantity: 1,
  unit: "project" as const,
  unit_price: 900,
  service_id: "33333333-3333-4333-8333-333333333333",
};

describe("proposal item editor", () => {
  it("opens, fills current values and cancels explicitly", async () => {
    const user = userEvent.setup();
    render(
      <ProposalItemEditor proposalId="proposal-a" item={catalogItem} canEdit />,
    );

    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Nome")).toHaveValue("Diagnóstico");
    expect(screen.getByLabelText("Quantidade")).toHaveValue(1);
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Snapshot alterado");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(
      screen.queryByRole("button", { name: "Salvar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("submits an update without changing the catalog association", async () => {
    const user = userEvent.setup();
    render(
      <ProposalItemEditor proposalId="proposal-a" item={catalogItem} canEdit />,
    );
    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Snapshot alterado");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(saveProposalItem).toHaveBeenCalledOnce());
    const data = vi.mocked(saveProposalItem).mock.calls[0]?.[0];
    expect(data?.get("itemId")).toBe(catalogItem.id);
    expect(data?.get("serviceId")).toBe("");
    expect(data?.get("name")).toBe("Snapshot alterado");
  });

  it("supports custom items and exposes an accessible save error", async () => {
    const user = userEvent.setup();
    render(
      <ProposalItemEditor
        proposalId="proposal-a"
        item={{ ...catalogItem, service_id: null, name: "Item customizado" }}
        canEdit
        hasError
      />,
    );
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível salvar",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Item customizado");
  });

  it("does not render mutation controls for read-only access", () => {
    render(
      <ProposalItemEditor
        proposalId="proposal-a"
        item={catalogItem}
        canEdit={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Editar" }),
    ).not.toBeInTheDocument();
  });
});
