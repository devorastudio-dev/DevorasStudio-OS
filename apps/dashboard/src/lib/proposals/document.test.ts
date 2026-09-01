import { describe, expect, it } from "vitest";
import { resolveProposalTokens, type ProposalDocument } from "./document";

export const documentFixture: ProposalDocument = {
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

describe("proposal tokens", () => {
  it("resolves every whitelisted token with pt-BR values", () => {
    const result = resolveProposalTokens(
      "{{client.name}} | {{proposal.number}} | {{proposal.title}} | {{proposal.valid_until}} | {{proposal.total}} | {{organization.name}}",
      documentFixture,
    );
    expect(result.value).toContain(
      "Cliente & Companhia | DEV-2026-0001 | Projeto seguro | 30/09/2026 | R$\u00a01.400,00 | Devora <Studio>",
    );
    expect(result.unknown).toEqual([]);
  });
  it("keeps unknown tokens visibly marked and never executes content", () => {
    const result = resolveProposalTokens(
      "{{client.secret}} <script>alert(1)</script>",
      documentFixture,
    );
    expect(result.value).toContain("{{client.secret}}");
    expect(result.unknown).toEqual(["client.secret"]);
  });
  it("handles null validity without inventing a value", () => {
    expect(
      resolveProposalTokens("X{{proposal.valid_until}}Y", {
        ...documentFixture,
        proposal: { ...documentFixture.proposal, validUntil: null },
      }).value,
    ).toBe("XY");
  });
});
