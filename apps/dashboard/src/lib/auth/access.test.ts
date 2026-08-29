import { describe, expect, it } from "vitest";

import { classifyMemberships } from "./access";

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
