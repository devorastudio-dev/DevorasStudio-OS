import { describe, expect, it } from "vitest";

import { parseEmailConfirmation } from "./callback";

describe("callback de e-mail", () => {
  it("aceita token de convite", () => {
    expect(
      parseEmailConfirmation(
        new URLSearchParams("token_hash=ficticio&type=invite"),
      ),
    ).toEqual({ tokenHash: "ficticio", type: "invite" });
  });

  it("rejeita callback incompleto ou de tipo não suportado", () => {
    expect(
      parseEmailConfirmation(new URLSearchParams("type=invite")),
    ).toBeNull();
    expect(
      parseEmailConfirmation(
        new URLSearchParams("token_hash=ficticio&type=signup"),
      ),
    ).toBeNull();
  });
});
