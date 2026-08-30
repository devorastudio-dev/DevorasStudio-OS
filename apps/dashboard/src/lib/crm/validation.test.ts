import { describe, expect, it } from "vitest";
import {
  companySchema,
  contactSchema,
  crmFiltersSchema,
  leadSchema,
  leadUpdateSchema,
} from "./validation";

const lead = {
  fullName: "Pessoa Ficticia",
  email: "PESSOA@EXAMPLE.INVALID",
  phone: "",
  companyText: "",
  serviceInterest: "automation",
  message: "Contexto comercial sintetico com tamanho valido.",
  source: "outbound",
  sourceDetail: "",
  assignedMembershipId: "",
  companyId: "",
  contactId: "",
};
describe("contratos do CRM", () => {
  it("normaliza pagina e busca controlada", () => {
    expect(
      crmFiltersSchema.parse({ page: "2", q: "Empresa 10" }),
    ).toMatchObject({ page: 2, q: "Empresa 10" });
  });
  it("recusa sintaxe de filtro na busca", () => {
    expect(
      crmFiltersSchema.safeParse({ q: "nome,status.eq.secret" }).success,
    ).toBe(false);
  });
  it("aceita lead manual e normaliza email", () => {
    const result = leadSchema.parse(lead);
    expect(result.email).toBe("pessoa@example.invalid");
    expect(result.phone).toBeNull();
  });
  it("exige descrição para origem outro", () => {
    expect(leadSchema.safeParse({ ...lead, source: "other" }).success).toBe(
      false,
    );
  });
  it("recusa origem fora do catálogo", () => {
    expect(
      leadSchema.safeParse({ ...lead, source: "arbitraria" }).success,
    ).toBe(false);
  });
  it("exige motivo ao desqualificar", () => {
    expect(
      leadUpdateSchema.safeParse({
        id: crypto.randomUUID(),
        version: 1,
        triageStatus: "disqualified",
        disqualificationReason: "",
        assignedMembershipId: "",
        companyId: "",
        contactId: "",
        archived: false,
      }).success,
    ).toBe(false);
  });
  it("aceita empresa sem CNPJ", () => {
    expect(
      companySchema.safeParse({
        displayName: "Empresa Ficticia",
        website: "",
        email: "",
        phone: "",
        source: "",
        sourceDetail: "",
        notes: "",
      }).success,
    ).toBe(true);
  });
  it("exige empresa para contato principal", () => {
    expect(
      contactSchema.safeParse({
        fullName: "Contato Ficticio",
        email: "",
        phone: "",
        jobTitle: "",
        companyId: "",
        isPrimary: true,
      }).success,
    ).toBe(false);
  });
});
