import { describe, expect, it } from "vitest";

import { assessInvitation, parseArguments } from "../../../scripts/invite-user";

describe("script administrativo de convite", () => {
  it("normaliza e valida parâmetros", () => {
    expect(
      parseArguments([
        "--email",
        " PESSOA@EXAMPLE.INVALID ",
        "--organization-id",
        "00000000-0000-4000-8000-000000000301",
      ]),
    ).toMatchObject({ email: "pessoa@example.invalid" });
  });

  it("prepara vínculo inexistente", () => {
    expect(assessInvitation([], "org-a")).toBe("prepare");
  });

  it("trata repetição do mesmo convite como idempotente", () => {
    expect(
      assessInvitation(
        [{ organization_id: "org-a", status: "invited" }],
        "org-a",
      ),
    ).toBe("idempotent");
  });

  it("rejeita organização diferente ou status incompatível", () => {
    expect(
      assessInvitation(
        [{ organization_id: "org-b", status: "invited" }],
        "org-a",
      ),
    ).toBe("conflict");
    expect(
      assessInvitation(
        [{ organization_id: "org-a", status: "active" }],
        "org-a",
      ),
    ).toBe("conflict");
  });
});
