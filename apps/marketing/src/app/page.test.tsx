import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("./contact-form", () => ({
  ContactForm: () => <form aria-label="Formulário de contato" />,
}));

import MarketingHome from "./page";

describe("MarketingHome", () => {
  it("mantém landmarks, hierarquia e destinos principais acessíveis", () => {
    render(<MarketingHome />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");
    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navegação móvel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pular para o conteúdo" }),
    ).toHaveAttribute("href", "#conteudo");
    expect(screen.getAllByRole("link", { name: "Contato" })).toHaveLength(2);
    expect(
      screen.getByRole("form", { name: "Formulário de contato" }),
    ).toBeInTheDocument();
  });

  it("apresenta somente os três serviços aprovados", () => {
    render(<MarketingHome />);
    const services = screen
      .getByRole("heading", { name: "Do problema à solução digital." })
      .closest("section");

    expect(services).not.toBeNull();
    expect(within(services!).getAllByRole("article")).toHaveLength(3);
    expect(within(services!).getByText("Presença digital")).toBeInTheDocument();
    expect(
      within(services!).getByText("Sistemas para o negócio"),
    ).toBeInTheDocument();
    expect(within(services!).getByText("Automações")).toBeInTheDocument();
  });

  it("abre a navegação móvel sem JavaScript de aplicação", async () => {
    const user = userEvent.setup();
    render(<MarketingHome />);
    const summary = screen.getByLabelText("Abrir menu de navegação");
    const menu = summary.closest("details");

    expect(menu).not.toHaveAttribute("open");
    await user.click(summary);
    expect(menu).toHaveAttribute("open");
  });
});
