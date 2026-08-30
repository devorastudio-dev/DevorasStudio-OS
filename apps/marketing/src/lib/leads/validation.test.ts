import { describe, expect, it } from "vitest";
import { evaluateSubmissionTiming, leadSchema } from "./validation";

const validLead = {
  fullName: "Pessoa Fictícia",
  email: "lead@example.invalid",
  phone: "",
  company: "",
  serviceInterest: "automation",
  message: "Mensagem sintética suficientemente longa para o teste.",
  consent: "on",
  landingPath: "/",
  utmSource: "campaign",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
};

describe("leadSchema", () => {
  it("normaliza um lead público válido", () => {
    const result = leadSchema.parse(validLead);
    expect(result.email).toBe("lead@example.invalid");
    expect(result.phone).toBeNull();
  });
  it("rejeita mensagem curta e consentimento ausente", () => {
    expect(
      leadSchema.safeParse({ ...validLead, message: "curta", consent: "" })
        .success,
    ).toBe(false);
  });
  it("rejeita caminho com query string", () => {
    expect(
      leadSchema.safeParse({ ...validLead, landingPath: "/?token=sensitive" })
        .success,
    ).toBe(false);
  });
});

describe("evaluateSubmissionTiming", () => {
  it("separa timestamp inválido, envio rápido e tempo válido", () => {
    expect(evaluateSubmissionTiming("", 5_000)).toBe("missing_or_invalid");
    expect(evaluateSubmissionTiming("invalid", 5_000)).toBe(
      "missing_or_invalid",
    );
    expect(evaluateSubmissionTiming("4000", 5_000)).toBe("too_fast");
    expect(evaluateSubmissionTiming("1000", 5_000)).toBe("valid");
  });
});
