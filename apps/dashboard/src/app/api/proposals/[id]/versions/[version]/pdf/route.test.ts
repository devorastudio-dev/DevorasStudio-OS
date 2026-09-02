import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authState: vi.fn(),
  hasPermission: vi.fn(),
  maybeSingle: vi.fn(),
  renderPdf: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("../../../../../../../lib/auth/access", () => ({
  getInternalAuthState: mocks.authState,
}));
vi.mock("../../../../../../../lib/auth/permissions", () => ({
  hasPermission: mocks.hasPermission,
}));
vi.mock("../../../../../../../lib/proposals/pdf", () => ({
  proposalPdfFilename: () => "DEV-2026-0004-v2-proposta.pdf",
  renderProposalPdf: mocks.renderPdf,
}));
vi.mock("../../../../../../../lib/proposals/snapshot", () => ({
  parseProposalSnapshot: (value: unknown) => value,
}));
vi.mock("../../../../../../../lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: async () => ({ data: [] }),
        maybeSingle: mocks.maybeSingle,
      };
      return chain;
    },
    rpc: mocks.rpc,
  }),
}));

import { GET } from "./route";

const snapshot = { proposal: { number: "DEV-2026-0004" } };
const context = {
  params: Promise.resolve({ id: "proposal-id", version: "2" }),
};

describe("download do PDF oficial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authState.mockResolvedValue({
      access: { organization: { id: "org-id" } },
      currentLevel: "aal2",
    });
    mocks.hasPermission.mockResolvedValue(true);
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "version-id", snapshot, version_number: 2 },
    });
    mocks.renderPdf.mockResolvedValue(Buffer.from("%PDF-test"));
    mocks.rpc.mockResolvedValue({ data: null, error: null });
  });

  it("exige autenticação AAL2", async () => {
    mocks.authState.mockResolvedValue({ access: null, currentLevel: "aal1" });
    expect((await GET(new Request("http://local"), context)).status).toBe(401);
  });

  it("nega usuário sem proposals.read", async () => {
    mocks.hasPermission.mockResolvedValue(false);
    expect((await GET(new Request("http://local"), context)).status).toBe(403);
  });

  it("não encontra versão inexistente ou cross-tenant", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });
    expect((await GET(new Request("http://local"), context)).status).toBe(404);
  });

  it("gera a versão solicitada com headers privados e filename seguro", async () => {
    const response = await GET(new Request("http://local"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      "DEV-2026-0004-v2-proposta.pdf",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.renderPdf).toHaveBeenCalledWith(
      expect.objectContaining({ document: snapshot, version: 2 }),
    );
  });
});
