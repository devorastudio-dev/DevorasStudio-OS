import { describe, expect, it } from "vitest";
import { classifyDueDate, formatOperationDate } from "./activity-task";
import {
  activitySchema,
  safeCrmReturn,
  taskSchema,
} from "./activity-task-validation";
const id = "11111111-1111-4111-8111-111111111111";
describe("atividades e tarefas", () => {
  it("classifica vencimento no fuso operacional", () => {
    const now = new Date("2026-08-30T15:00:00Z");
    expect(classifyDueDate("2026-08-29T15:00:00Z", now)).toBe("overdue");
    expect(classifyDueDate("2026-08-30T20:00:00Z", now)).toBe("today");
    expect(classifyDueDate("2026-08-31T12:00:00Z", now)).toBe("upcoming");
  });
  it("formata no fuso de Sao Paulo", () =>
    expect(formatOperationDate("2026-08-30T13:00:00Z")).toMatch(/10:00/));
  it("atividade exige lead ou oportunidade", () =>
    expect(
      activitySchema.safeParse({
        activityType: "call",
        title: "Contato",
        occurredAt: "2026-08-30T10:00",
        assignedMembershipId: id,
        returnTo: "/crm/tasks",
        leadId: "",
        opportunityId: "",
        companyId: "",
        contactId: "",
      }).success,
    ).toBe(false));
  it("tarefa exige prazo e entidade", () =>
    expect(
      taskSchema.safeParse({
        title: "Retornar",
        dueAt: "",
        assignedMembershipId: id,
        returnTo: "/crm/tasks",
        leadId: id,
        opportunityId: "",
        companyId: "",
        contactId: "",
      }).success,
    ).toBe(false));
  it("impede redirect externo", () =>
    expect(safeCrmReturn("https://example.invalid")).toBe("/crm/tasks"));
});
