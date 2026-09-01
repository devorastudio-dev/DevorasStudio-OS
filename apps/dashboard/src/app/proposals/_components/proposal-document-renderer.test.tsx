// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProposalDocument } from "../../../lib/proposals/document";
import { ProposalDocumentRenderer } from "./proposal-document-renderer";

const documentFixture: ProposalDocument = {
  proposal: {
    number: "DEV-2026-0001",
    title: "Projeto seguro",
    createdAt: "2026-09-01T12:00:00Z",
    validUntil: "2026-09-30",
    subtotal: 1500,
    discount: 100,
    total: 1400,
  },
  organization: {
    name: "Devora <Studio>",
    email: null,
    phone: null,
    website: null,
    city: null,
    logoPath: null,
  },
  client: { name: "Cliente & Companhia" },
  sections: [],
  items: [],
};

describe("proposal document renderer", () => {
  it("renders semantic header, client, visible content and official totals", () => {
    render(
      <ProposalDocumentRenderer
        document={{
          ...documentFixture,
          sections: [
            {
              id: "a",
              title: "Escopo",
              content: "Olá, {{client.name}}",
              type: "scope",
              visible: true,
              position: 1,
            },
            {
              id: "b",
              title: "Oculta",
              content: "segredo",
              type: "notes",
              visible: false,
              position: 2,
            },
            {
              id: "c",
              title: "Vazia",
              content: "",
              type: "custom",
              visible: true,
              position: 3,
            },
          ],
          items: [
            {
              id: "i",
              name: "Serviço",
              description: "Snapshot",
              quantity: 1,
              unit: "project",
              unitPrice: 1500,
              total: 1500,
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Projeto seguro" }),
    ).toBeInTheDocument();
    expect(screen.getByText("DEV-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Olá, Cliente & Companhia")).toBeInTheDocument();
    expect(screen.queryByText("segredo")).not.toBeInTheDocument();
    expect(screen.queryByText("Vazia")).not.toBeInTheDocument();
    expect(screen.getAllByText("R$ 1.500,00").length).toBeGreaterThan(0);
    expect(screen.getByText("R$ 1.400,00")).toBeInTheDocument();
  });
  it("escapes HTML instead of interpreting editorial markup", () => {
    const { container } = render(
      <ProposalDocumentRenderer
        document={{
          ...documentFixture,
          sections: [
            {
              id: "x",
              title: "Seguro",
              content: "<script>alert(1)</script><img src=x onerror=alert(2)>",
              type: "custom",
              visible: true,
              position: 1,
            },
          ],
        }}
      />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<script>alert/)).toBeInTheDocument();
  });
});
