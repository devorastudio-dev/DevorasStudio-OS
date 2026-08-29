import { describe, expect, it } from "vitest";

import { classifyMemberships, decideInternalDestination } from "./access";

describe("classificação de acesso ao dashboard", () => {
  it("libera exatamente um vínculo ativo", () => {
    expect(classifyMemberships([{ status: "active" }])).toBe("active");
  });

  it.each(["invited", "suspended"] as const)(
    "não libera vínculo %s",
    (status) => {
      expect(classifyMemberships([{ status }])).toBe("inactive");
    },
  );

  it("não libera usuário sem organização", () => {
    expect(classifyMemberships([])).toBe("missing");
  });

  it("não libera múltiplas organizações ambíguas", () => {
    expect(
      classifyMemberships([{ status: "active" }, { status: "active" }]),
    ).toBe("ambiguous");
  });
});

describe("decisão de MFA", () => {
  it.each([
    [
      {
        user: false,
        membership: "missing",
        hasVerifiedTotp: false,
        currentLevel: null,
      },
      "login",
    ],
    [
      {
        user: true,
        membership: "inactive",
        hasVerifiedTotp: false,
        currentLevel: "aal1",
      },
      "access-pending",
    ],
    [
      {
        user: true,
        membership: "active",
        hasVerifiedTotp: false,
        currentLevel: "aal1",
      },
      "mfa-enroll",
    ],
    [
      {
        user: true,
        membership: "active",
        hasVerifiedTotp: true,
        currentLevel: "aal1",
      },
      "mfa-challenge",
    ],
    [
      {
        user: true,
        membership: "active",
        hasVerifiedTotp: true,
        currentLevel: "aal2",
      },
      "allowed",
    ],
  ] as const)("decide %#", (input, expected) => {
    expect(decideInternalDestination(input)).toBe(expected);
  });
});
