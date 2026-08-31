import { describe, expect, it } from "vitest";
import { resolveProposalPrefill } from "./prefill";

const clients = [{ id: "client-a" }, { id: "client-b" }];
const links = [{ client_id: "client-b", opportunity_id: "opportunity-b" }];

describe("proposal prefill", () => {
  it("prefills a valid client without requiring another selection", () => {
    expect(
      resolveProposalPrefill({ client: "client-a" }, clients, links),
    ).toEqual({
      clientId: "client-a",
      opportunityId: "",
    });
  });

  it("derives the tenant-scoped client from the opportunity", () => {
    expect(
      resolveProposalPrefill({ opportunity: "opportunity-b" }, clients, links),
    ).toEqual({ clientId: "client-b", opportunityId: "opportunity-b" });
  });

  it("does not combine an opportunity with an unrelated client", () => {
    expect(
      resolveProposalPrefill(
        { client: "client-a", opportunity: "unknown" },
        clients,
        links,
      ),
    ).toEqual({ clientId: "client-a", opportunityId: "" });
  });
});
