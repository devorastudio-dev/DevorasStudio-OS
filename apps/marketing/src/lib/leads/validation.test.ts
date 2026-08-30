import { describe, expect, it } from "vitest";
import { isAutomatedSubmission, leadSchema } from "./validation";

const validLead = {
  fullName: "Maria Silva",
  email: "maria@example.com",
  phone: "",
  company: "",
  serviceInterest: "automation",
  message: "Quero entender uma automação para o meu processo.",
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
    expect(result.email).toBe("maria@example.com");
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

describe("isAutomatedSubmission", () => {
  it("detecta honeypot preenchido", () => {
    expect(isAutomatedSubmission("bot", "1000", 5000)).toBe(true);
  });
  it("detecta envio rápido e aceita tempo plausível", () => {
    expect(isAutomatedSubmission("", "4000", 5000)).toBe(true);
    expect(isAutomatedSubmission("", "1000", 5000)).toBe(false);
  });
});
