import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, createProposalsDb, redirect, rpc } = vi.hoisted(() => {
  const rpc = vi.fn();
  return {
    createClient: vi.fn(async () => ({ rpc })),
    createProposalsDb: vi.fn(async () => ({ rpc })),
    redirect: vi.fn(),
    rpc,
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("../supabase/server", () => ({ createClient }));
vi.mock("./db", () => ({ createProposalsDb }));
vi.mock("./access", () => ({ requireProposalsAccess: vi.fn() }));

import { createProposal } from "./actions";

describe("createProposal", () => {
  const clientId = "10000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({
      data: "20000000-0000-4000-8000-000000000001",
      error: null,
    });
  });

  it("preserva argumentos nulos exigidos pela RPC ao criar por template", async () => {
    const data = new FormData();
    data.set("clientId", clientId);
    data.set("templateId", "30000000-0000-4000-8000-000000000001");
    data.set("title", "Proposta por template");

    await createProposal(data);

    expect(rpc).toHaveBeenCalledWith("create_proposal_from_template", {
      target_client_id: clientId,
      target_opportunity_id: null,
      proposal_title: "Proposta por template",
      proposal_valid_until: null,
      target_template_id: "30000000-0000-4000-8000-000000000001",
    });
    expect(createProposalsDb).toHaveBeenCalledOnce();
  });

  it("cria proposta em branco com oportunidade vinculada", async () => {
    const opportunityId = "40000000-0000-4000-8000-000000000001";
    const data = new FormData();
    data.set("clientId", clientId);
    data.set("opportunityId", opportunityId);
    data.set("title", "Proposta em branco");
    data.set("validUntil", "2026-10-01");

    await createProposal(data);

    expect(rpc).toHaveBeenCalledWith("create_proposal", {
      target_client_id: clientId,
      target_opportunity_id: opportunityId,
      proposal_title: "Proposta em branco",
      proposal_valid_until: "2026-10-01",
    });
    expect(createClient).toHaveBeenCalledOnce();
  });
});
