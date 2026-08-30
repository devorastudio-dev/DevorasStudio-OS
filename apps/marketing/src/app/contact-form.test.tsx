import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { submitLead } = vi.hoisted(() => ({ submitLead: vi.fn() }));
vi.mock("./actions", () => ({ submitLead }));

import { ContactForm } from "./contact-form";

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nome completo"), "Maria Silva");
  await user.type(screen.getByLabelText("E-mail"), "maria@example.com");
  await user.selectOptions(screen.getByLabelText("Assunto"), "automation");
  await user.type(
    screen.getByLabelText("Conte um pouco sobre o desafio"),
    "Quero entender uma automação para o meu processo.",
  );
  await user.click(screen.getByRole("checkbox"));
  return user;
}

describe("ContactForm", () => {
  beforeEach(() => submitLead.mockReset());

  it("envia pela Server Action sem navegação e anuncia o sucesso", async () => {
    submitLead.mockResolvedValue({
      status: "success",
      message: "Recebemos sua mensagem. Obrigado pelo contato.",
    });
    render(<ContactForm />);
    const form = screen
      .getByRole("button", { name: "Enviar mensagem" })
      .closest("form");
    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    await waitFor(() => expect(submitLead).toHaveBeenCalledOnce());
    expect(form).toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Recebemos sua mensagem",
    );
  });

  it("mantém os campos e anuncia uma falha recuperável", async () => {
    submitLead.mockResolvedValue({
      status: "error",
      message:
        "Não foi possível enviar agora. Seus dados foram mantidos; tente novamente.",
    });
    render(<ContactForm />);
    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível enviar agora",
    );
    expect(screen.getByLabelText("Nome completo")).toHaveValue("Maria Silva");
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria@example.com");
    expect(screen.getByLabelText("Conte um pouco sobre o desafio")).toHaveValue(
      "Quero entender uma automação para o meu processo.",
    );
  });
});
