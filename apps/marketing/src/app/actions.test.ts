import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("../lib/supabase/server", () => ({
  createPublicSupabaseClient: () => ({ rpc }),
}));

import * as actionModule from "./actions";
import { submitLead } from "./actions";
import { initialLeadState } from "./lead-action-state";

function validForm() {
  const data = new FormData();
  data.set("fullName", "Pessoa Fictícia");
  data.set("email", "lead@example.invalid");
  data.set("phone", "");
  data.set("company", "");
  data.set("serviceInterest", "automation");
  data.set("message", "Mensagem sintética suficientemente longa para o teste.");
  data.set("consent", "on");
  data.set("landingPath", "/");
  data.set("startedAt", String(Date.now() - 3_000));
  return data;
}

describe("submitLead", () => {
  let consoleInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rpc.mockReset();
    consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });
  afterEach(() => consoleInfo.mockRestore());

  it("só confirma sucesso após a RPC confirmar persistência", async () => {
    rpc.mockResolvedValue({ data: "persisted", error: null });
    const state = await submitLead(initialLeadState, validForm());
    expect(state.status).toBe("success");
    expect(rpc).toHaveBeenCalledWith(
      "submit_public_lead",
      expect.objectContaining({
        email: "lead@example.invalid",
        service_interest: "automation",
      }),
    );
  });

  it.each(["organization_not_found", "rate_limited", null, true])(
    "não apresenta sucesso para o retorno %s",
    async (data) => {
      rpc.mockResolvedValue({ data, error: null });
      expect((await submitLead(initialLeadState, validForm())).status).toBe(
        "error",
      );
    },
  );

  it("aceita duplicação somente quando a RPC confirma o registro existente", async () => {
    rpc.mockResolvedValue({ data: "duplicate", error: null });
    expect((await submitLead(initialLeadState, validForm())).status).toBe(
      "success",
    );
  });

  it("não transforma erro da RPC ou de rede em sucesso", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });
    expect((await submitLead(initialLeadState, validForm())).status).toBe(
      "error",
    );
    rpc.mockRejectedValueOnce(new Error("network detail"));
    expect((await submitLead(initialLeadState, validForm())).status).toBe(
      "error",
    );
  });

  it("rejeita email inválido antes de chamar a RPC", async () => {
    const data = validForm();
    data.set("email", "email-invalido");
    const state = await submitLead(initialLeadState, data);
    expect(state.status).toBe("error");
    expect(state.message).toBe("Revise os campos indicados e tente novamente.");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("descarta somente o honeypot deliberado com resposta neutra", async () => {
    const data = validForm();
    data.set("fax_extension_7f3a", "spam");
    expect((await submitLead(initialLeadState, data)).status).toBe("success");
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(["", "inválido"])(
    "trata timestamp ausente ou inválido sem falso sucesso",
    async (startedAt) => {
      const data = validForm();
      data.set("startedAt", startedAt);
      expect((await submitLead(initialLeadState, data)).status).toBe("error");
      expect(rpc).not.toHaveBeenCalled();
    },
  );

  it("não descarta silenciosamente um envio rápido", async () => {
    const data = validForm();
    data.set("startedAt", String(Date.now()));
    expect((await submitLead(initialLeadState, data)).status).toBe("error");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("registra somente metadados técnicos catalogados", async () => {
    rpc.mockResolvedValue({ data: "persisted", error: null });
    await submitLead(initialLeadState, validForm());
    const serialized = String(consoleInfo.mock.calls[0]?.[0]);
    expect(Object.keys(JSON.parse(serialized))).toEqual([
      "request_id",
      "outcome",
      "technical_code",
      "duration_ms",
    ]);
    expect(serialized).not.toContain("lead@example.invalid");
    expect(serialized).not.toContain("Pessoa Fictícia");
    expect(serialized).not.toContain("Mensagem sintética");
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
