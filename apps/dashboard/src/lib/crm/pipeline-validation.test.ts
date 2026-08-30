import { describe, expect, it } from "vitest";
import {
  createOpportunitySchema,
  moveOpportunitySchema,
  pipelineFiltersSchema,
  updateOpportunitySchema,
} from "./pipeline-validation";

const opportunityId = "11111111-1111-4111-8111-111111111111";
const stageId = "22222222-2222-4222-8222-222222222222";

describe("contratos do pipeline comercial", () => {
  it("aceita a conversao de lead com valor monetario decimal", () => {
    expect(
      createOpportunitySchema.parse({
        leadId: opportunityId,
        title: "Automacao comercial",
        estimatedValue: "1250,50",
      }),
    ).toMatchObject({ estimatedValue: 1250.5 });
  });

  it("recusa valor negativo ou acima da precisao do banco", () => {
    expect(
      createOpportunitySchema.safeParse({
        leadId: opportunityId,
        estimatedValue: "-1",
      }).success,
    ).toBe(false);
    expect(
      createOpportunitySchema.safeParse({
        leadId: opportunityId,
        estimatedValue: "1000000000000",
      }).success,
    ).toBe(false);
  });

  it("exige complemento ao selecionar outro motivo de perda", () => {
    expect(
      moveOpportunitySchema.safeParse({
        opportunityId,
        stageId,
        version: "1",
        lossReason: "other",
        lossDetail: "",
      }).success,
    ).toBe(false);
  });

  it("aceita movimento versionado com motivo catalogado", () => {
    expect(
      moveOpportunitySchema.safeParse({
        opportunityId,
        stageId,
        version: "2",
        lossReason: "price",
        lossDetail: "",
      }).success,
    ).toBe(true);
  });

  it("valida responsavel e arquivamento na atualizacao", () => {
    expect(
      updateOpportunitySchema.safeParse({
        opportunityId,
        version: "3",
        title: "Contrato anual",
        estimatedValue: "9000",
        assignedMembershipId: stageId,
        archived: true,
      }).success,
    ).toBe(true);
  });

  it("recusa filtros fora dos catalogos e UUIDs", () => {
    expect(
      pipelineFiltersSchema.safeParse({ stage: "all", category: "closed" })
        .success,
    ).toBe(false);
  });
});
