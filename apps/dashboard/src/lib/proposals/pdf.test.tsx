import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { proposalPdfFilename, renderProposalPdf } from "./pdf";
import type { ProposalSnapshot } from "./snapshot";

const snapshot: ProposalSnapshot = {
  proposal: {
    number: "DEV-2026-0004",
    title: "Website Institucional",
    createdAt: "2026-09-01T12:00:00Z",
    validUntil: "2026-09-30",
    subtotal: 3400,
    discount: 400,
    total: 3000,
  },
  organization: {
    name: "Devora Studio",
    email: "comercial@example.invalid",
    phone: null,
    website: "example.invalid",
    city: "São Paulo",
    logoPath: null,
  },
  client: { name: "Clínica Exemplo" },
  sections: [
    {
      id: "section-1",
      title: "Objetivo",
      content:
        "Criar uma presença digital elegante.\n- Conteúdo com acentuação.",
      type: "objective",
      visible: true,
      position: 1,
    },
    {
      id: "hidden",
      title: "Oculta",
      content: "Não renderizar",
      type: "notes",
      visible: false,
      position: 2,
    },
  ],
  items: [
    {
      id: "item-1",
      name: "Website",
      description: "Projeto completo",
      quantity: 1,
      unit: "project",
      unitPrice: 3400,
      total: 3400,
    },
  ],
};

describe("PDF oficial de proposta", () => {
  it("gera um PDF A4 a partir do snapshot e aceita caracteres PT-BR", async () => {
    const pdf = await renderProposalPdf({ document: snapshot, version: 2 });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(2_000);
  }, 15_000);

  it("suporta conteúdo longo, múltiplos itens, desconto zero e anexos", async () => {
    const document = {
      ...snapshot,
      proposal: { ...snapshot.proposal, discount: 0, total: 3400 },
      sections: [
        {
          ...snapshot.sections[0]!,
          content: Array.from(
            { length: 120 },
            (_, index) => `Parágrafo longo ${index + 1}`,
          ).join("\n"),
        },
      ],
      items: Array.from({ length: 35 }, (_, index) => ({
        ...snapshot.items[0]!,
        id: `item-${index}`,
        name: `Item extenso ${index + 1}`,
      })),
    };
    const pdf = await renderProposalPdf({
      document,
      version: 1,
      attachments: [{ fileName: "briefing-técnico.pdf" }],
    });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(5_000);
  }, 20_000);

  it("gera filename seguro sem UUID ou texto bruto", () => {
    expect(proposalPdfFilename(" DÉV/2026 0004 ", 2)).toBe(
      "DEV-2026-0004-v2-proposta.pdf",
    );
  });
});
