import { describe, expect, it, vi } from "vitest";

import { prepareMfaEnrollment } from "./mfa-enrollment";

function mfaPort(overrides: Record<string, unknown> = {}) {
  return {
    enroll: vi.fn().mockResolvedValue({
      data: { id: "factor-new", totp: { qr_code: "qr", secret: "secret" } },
      error: null,
    }),
    listFactors: vi.fn().mockResolvedValue({ data: { all: [] }, error: null }),
    unenroll: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

describe("prepareMfaEnrollment", () => {
  it("remove fatores TOTP abandonados antes de criar um novo", async () => {
    const mfa = mfaPort({
      listFactors: vi.fn().mockResolvedValue({
        data: {
          all: [
            { factor_type: "totp", id: "old", status: "unverified" },
            { factor_type: "totp", id: "verified", status: "verified" },
          ],
        },
        error: null,
      }),
    });

    await expect(prepareMfaEnrollment(mfa)).resolves.toEqual({
      factorId: "factor-new",
      qrCode: "qr",
      secret: "secret",
    });
    expect(mfa.unenroll).toHaveBeenCalledOnce();
    expect(mfa.unenroll).toHaveBeenCalledWith({ factorId: "old" });
    expect(mfa.enroll).toHaveBeenCalledOnce();
  });

  it("encerra com erro e nao cria fator quando a limpeza falha", async () => {
    const mfa = mfaPort({
      listFactors: vi.fn().mockResolvedValue({
        data: {
          all: [{ factor_type: "totp", id: "old", status: "unverified" }],
        },
        error: null,
      }),
      unenroll: vi.fn().mockResolvedValue({ error: new Error("failed") }),
    });

    await expect(prepareMfaEnrollment(mfa)).rejects.toThrow(
      "MFA_FACTOR_CLEANUP_FAILED",
    );
    expect(mfa.enroll).not.toHaveBeenCalled();
  });

  it("propaga falha de enrollment para permitir nova tentativa", async () => {
    const mfa = mfaPort({
      enroll: vi
        .fn()
        .mockResolvedValue({ data: null, error: new Error("failed") }),
    });

    await expect(prepareMfaEnrollment(mfa)).rejects.toThrow(
      "MFA_ENROLLMENT_FAILED",
    );
  });
});
