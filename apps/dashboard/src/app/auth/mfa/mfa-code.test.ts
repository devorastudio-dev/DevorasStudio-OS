import { describe, expect, it } from "vitest";

import { totpCodeSchema } from "./mfa-code";

describe("código TOTP", () => {
  it("aceita exatamente seis dígitos", () =>
    expect(totpCodeSchema.parse("123456")).toBe("123456"));
  it.each(["12345", "1234567", "12a456", ""])("rejeita %s", (value) =>
    expect(totpCodeSchema.safeParse(value).success).toBe(false),
  );
});
