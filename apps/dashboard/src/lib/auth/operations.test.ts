import { describe, expect, it, vi } from "vitest";

import {
  GENERIC_RECOVERY_MESSAGE,
  performLogout,
  performPasswordLogin,
  requestPasswordRecovery,
} from "./operations";

describe("operações de autenticação", () => {
  it("aceita login válido", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    await expect(
      performPasswordLogin(
        { signInWithPassword },
        { email: "pessoa@example.invalid", password: "SenhaFicticia123" },
      ),
    ).resolves.toBe(true);
  });

  it("trata credencial inválida e falha interna sem detalhes", async () => {
    const invalid = vi.fn().mockResolvedValue({ error: new Error("invalid") });
    const failure = vi.fn().mockRejectedValue(new Error("internal"));

    await expect(
      performPasswordLogin(
        { signInWithPassword: invalid },
        { email: "pessoa@example.invalid", password: "incorreta" },
      ),
    ).resolves.toBe(false);
    await expect(
      performPasswordLogin(
        { signInWithPassword: failure },
        { email: "pessoa@example.invalid", password: "incorreta" },
      ),
    ).resolves.toBe(false);
  });

  it("recuperação responde genericamente mesmo quando o provedor falha", async () => {
    const resetPasswordForEmail = vi.fn().mockRejectedValue(new Error("falha"));
    await expect(
      requestPasswordRecovery(
        { resetPasswordForEmail },
        "pessoa@example.invalid",
        "https://app.example.invalid/auth/callback",
      ),
    ).resolves.toBe(GENERIC_RECOVERY_MESSAGE);
  });

  it("logout encerra o acesso quando o provedor confirma", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    await expect(performLogout({ signOut })).resolves.toBe(true);
    expect(signOut).toHaveBeenCalledOnce();
  });
});
