import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/_components/navbar", () => ({
  default: () => (
    <nav aria-label="Navegação principal">
      <Link href="/servicos">Serviços</Link>
      <Link href="/produtos">Produtos</Link>
      <Link href="/projetos">Projetos</Link>
      <Link href="/#contato">Contato</Link>
    </nav>
  ),
}));
vi.mock("@/app/_components/hero", () => ({
  default: () => (
    <section id="inicio">
      <h1>Hero manual</h1>
    </section>
  ),
}));
vi.mock("@/app/_components/services", () => ({
  default: () => (
    <section id="servicos">
      <h2>Serviços</h2>
    </section>
  ),
}));
vi.mock("@/app/_components/portfolio", () => ({
  default: () => (
    <section id="portfolio">
      <h2>Projetos</h2>
    </section>
  ),
}));
vi.mock("@/app/_components/products", () => ({
  default: () => (
    <section id="produtos">
      <h2>Produtos</h2>
    </section>
  ),
}));
vi.mock("@/app/_components/process", () => ({
  default: () => (
    <section id="processo">
      <h2>Processo</h2>
    </section>
  ),
}));
vi.mock("@/app/_components/cta", () => ({
  default: () => (
    <section id="contato">
      <h2>Contato</h2>
      <form aria-label="Formulário de contato" />
    </section>
  ),
}));
vi.mock("@/app/_components/faq", () => ({
  default: () => (
    <section>
      <h2>Perguntas frequentes</h2>
    </section>
  ),
}));
vi.mock("@/app/_components/footer", () => ({
  default: () => (
    <footer>
      <a href="/privacy">Política de Privacidade</a>
      <a href="https://app.devorastudio.com.br">Acesso interno</a>
    </footer>
  ),
}));

import MarketingHome from "./page";

describe("MarketingHome", () => {
  it("integra todas as seções manuais e o formulário seguro", () => {
    const { container } = render(<MarketingHome />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");
    for (const id of [
      "inicio",
      "servicos",
      "portfolio",
      "produtos",
      "processo",
      "contato",
    ]) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("form", { name: "Formulário de contato" }),
    ).toBeInTheDocument();
  });

  it("mantém navegação, privacidade e dashboard nos destinos corretos", () => {
    render(<MarketingHome />);

    expect(
      screen.getByRole("link", { name: "Pular para o conteúdo" }),
    ).toHaveAttribute("href", "#conteudo");
    expect(
      screen.getByRole("link", { name: "Política de Privacidade" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "Acesso interno" }),
    ).toHaveAttribute("href", "https://app.devorastudio.com.br");
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe("#");
    }
  });
});
