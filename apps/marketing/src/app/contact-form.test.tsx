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
  beforeEach(() => {
    submitLead.mockReset();
    window.history.replaceState({}, "", "/");
  });

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

  it("deixa a validação nativa bloquear um e-mail inválido", async () => {
    render(<ContactForm />);
    const user = await fillValidForm();
    const email = screen.getByLabelText("E-mail");
    await user.clear(email);
    await user.type(email, "email-invalido");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(email).toBeInvalid();
    expect(submitLead).not.toHaveBeenCalled();
  });

  it("envia a origem e as UTMs sem permitir submissões concorrentes", async () => {
    window.history.replaceState(
      {},
      "",
      "/?utm_source=google&utm_medium=cpc&utm_campaign=lancamento",
    );
    let resolveAction:
      ((value: { status: "success"; message: string }) => void) | undefined;
    submitLead.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(<ContactForm />);
    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Enviando…",
    });
    expect(pendingButton).toBeDisabled();
    expect(submitLead).toHaveBeenCalledOnce();
    const formData = submitLead.mock.calls[0]?.[1] as FormData;
    expect(formData.get("landingPath")).toBe("/");
    expect(formData.get("utmSource")).toBe("google");
    expect(formData.get("utmMedium")).toBe("cpc");
    expect(formData.get("utmCampaign")).toBe("lancamento");

    resolveAction?.({ status: "success", message: "Mensagem recebida." });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Mensagem recebida.",
    );
  });

  it("permite tentar novamente depois de uma falha", async () => {
    submitLead
      .mockResolvedValueOnce({
        status: "error",
        message: "Não foi possível enviar agora.",
      })
      .mockResolvedValueOnce({
        status: "success",
        message: "Recebemos sua mensagem. Obrigado pelo contato.",
      });
    render(<ContactForm />);
    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Recebemos sua mensagem",
    );
    expect(submitLead).toHaveBeenCalledTimes(2);
  });

  it("mantém o honeypot fora do autofill e da navegação por teclado", () => {
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="fax_extension_7f3a"]',
    );
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("data-1p-ignore", "true");
    expect(honeypot).toHaveValue("");
  });
});
