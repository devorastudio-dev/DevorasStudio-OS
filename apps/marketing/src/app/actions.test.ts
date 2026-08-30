import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("../lib/supabase/server", () => ({
  createPublicSupabaseClient: () => ({ rpc }),
}));

import * as actionModule from "./actions";
import { submitLead } from "./actions";
import { initialLeadState } from "./lead-action-state";

function validForm() {
  const data = new FormData();
  data.set("fullName", "Maria Silva");
  data.set("email", "maria@example.com");
  data.set("phone", "");
  data.set("company", "");
  data.set("serviceInterest", "automation");
  data.set("message", "Quero entender uma automação para o meu processo.");
  data.set("consent", "on");
  data.set("landingPath", "/");
  data.set("startedAt", String(Date.now() - 3_000));
  return data;
}

describe("submitLead", () => {
  beforeEach(() => rpc.mockReset());

  it("envia somente o contrato público pela RPC oficial", async () => {
    rpc.mockResolvedValue({ error: null });
    const state = await submitLead(initialLeadState, validForm());
    expect(state.status).toBe("success");
    expect(rpc).toHaveBeenCalledWith(
      "submit_public_lead",
      expect.objectContaining({
        email: "maria@example.com",
        service_interest: "automation",
      }),
    );
  });

  it("retorna erro genérico e recuperável quando a infraestrutura falha", async () => {
    rpc.mockResolvedValue({ error: new Error("internal detail") });
    const state = await submitLead(initialLeadState, validForm());
    expect(state).toEqual({
      status: "error",
      message:
        "Não foi possível enviar agora. Seus dados foram mantidos; tente novamente.",
    });
    expect(state.message).not.toContain("internal detail");
  });

  it("não persiste submissão detectada pelo honeypot", async () => {
    const data = validForm();
    data.set("website", "spam");
    const state = await submitLead(initialLeadState, data);
    expect(state.status).toBe("success");
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("módulo da Server Action", () => {
  it("exporta somente funções assíncronas", () => {
    expect(Object.keys(actionModule)).toEqual(["submitLead"]);
    expect(
      Object.values(actionModule).every(
        (exported) =>
          typeof exported === "function" &&
          exported.constructor.name === "AsyncFunction",
      ),
    ).toBe(true);
  });
});
