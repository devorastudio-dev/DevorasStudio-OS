// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enroll: vi.fn(),
  listFactors: vi.fn(),
  rpc: vi.fn(),
  unenroll: vi.fn(),
}));

vi.mock("../../../../lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      mfa: {
        enroll: mocks.enroll,
        listFactors: mocks.listFactors,
        unenroll: mocks.unenroll,
      },
    },
    rpc: mocks.rpc,
  }),
}));

import { MfaEnrollForm } from "./mfa-enroll-form";

describe("MfaEnrollForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.unenroll.mockResolvedValue({ error: null });
    mocks.enroll.mockResolvedValue({
      data: {
        id: "new-factor",
        totp: {
          qr_code: "<svg xmlns='http://www.w3.org/2000/svg'></svg>",
          secret: "synthetic-secret",
        },
      },
      error: null,
    });
  });

  it("encerra o carregamento e permite tentar novamente apos falha", async () => {
    mocks.listFactors
      .mockResolvedValueOnce({ data: null, error: new Error("unavailable") })
      .mockResolvedValueOnce({ data: { all: [] }, error: null });
    const user = userEvent.setup();

    render(<MfaEnrollForm nextPath="/" />);

    expect(
      await screen.findByText(
        "Não foi possível iniciar a configuração de MFA.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByAltText(
        "QR Code para cadastrar o Devora OS no aplicativo autenticador",
      ),
    ).toBeInTheDocument();
    expect(mocks.enroll).toHaveBeenCalledOnce();
  });
});
