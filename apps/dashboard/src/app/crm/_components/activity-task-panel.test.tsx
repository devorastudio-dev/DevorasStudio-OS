// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityTaskPanel } from "./activity-task-panel";

vi.mock("../../../lib/crm/activity-task-actions", () => ({
  createCrmActivity: vi.fn(),
  createCrmTask: vi.fn(),
  transitionCrmTask: vi.fn(),
}));

const members = [
  { id: "11111111-1111-4111-8111-111111111111", label: "Membro teste" },
];
describe("painel de acompanhamento comercial", () => {
  it("oferece formulários rotulados e ações por teclado", () => {
    render(
      <ActivityTaskPanel
        canWrite
        returnTo="/crm/leads/22222222-2222-4222-8222-222222222222"
        members={members}
        link={{ leadId: "22222222-2222-4222-8222-222222222222" }}
        activities={[]}
        tasks={[]}
      />,
    );
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Data e hora")).toBeRequired();
    expect(screen.getByLabelText("Prazo")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Registrar atividade" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma próxima ação pendente."),
    ).toBeInTheDocument();
  });
  it("mostra somente eventos reais e próxima tarefa pendente", () => {
    render(
      <ActivityTaskPanel
        canWrite={false}
        returnTo="/crm/tasks"
        members={members}
        link={{ leadId: "22222222-2222-4222-8222-222222222222" }}
        activities={[
          {
            id: "a",
            activity_type: "call",
            title: "Contato realizado",
            description: null,
            occurred_at: "2026-08-30T13:00:00Z",
          },
        ]}
        tasks={[
          {
            id: "t",
            title: "Enviar retorno",
            due_at: "2026-08-31T13:00:00Z",
            status: "pending",
            version: 1,
          },
        ]}
      />,
    );
    expect(
      screen.getByText(/Próxima ação: Enviar retorno/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ligação · Contato realizado/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Concluir" }),
    ).not.toBeInTheDocument();
  });
});
