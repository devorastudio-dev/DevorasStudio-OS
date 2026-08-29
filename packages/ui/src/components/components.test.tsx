import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Alert } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Spinner } from "./spinner";
import { Textarea } from "./textarea";

describe("componentes fundamentais", () => {
  it("renderiza controles com nomes e associações acessíveis", () => {
    const { container } = render(
      <Card aria-label="Dados de contato">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" />
        <Label htmlFor="message">Mensagem</Label>
        <Textarea id="message" />
        <Spinner label="Carregando dados" />
      </Card>,
    );

    expect(container.firstElementChild).toHaveClass("dv-card");
    expect(screen.getByRole("textbox", { name: "Nome" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Mensagem" })).toBeVisible();
    expect(
      screen.getByRole("status", { name: "Carregando dados" }),
    ).toBeVisible();
  });

  it("preserva atributos e impede a ação de um botão desabilitado", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button aria-label="Salvar alterações" disabled onClick={onClick}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Salvar alterações" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("aciona o botão nativo pelo teclado", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Continuar</Button>);
    const button = screen.getByRole("button", { name: "Continuar" });

    button.focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("aplica variantes principais sem perder o conteúdo textual", () => {
    render(
      <>
        <Button variant="danger">Excluir</Button>
        <Badge variant="success">Ativo</Badge>
        <Alert variant="error">Falha ao salvar</Alert>
      </>,
    );

    expect(screen.getByRole("button", { name: "Excluir" })).toHaveClass(
      "dv-button--danger",
    );
    expect(screen.getByText("Ativo")).toHaveClass("dv-badge--success");
    expect(screen.getByRole("alert")).toHaveAttribute("data-variant", "error");
  });
});
