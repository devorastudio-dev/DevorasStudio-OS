import { describe, expect, it } from "vitest";
import { leadEmailHref, leadEmailText } from "./lead-presentation";

describe("lead email presentation", () => {
  it("shows a friendly absence without creating mailto", () => {
    expect(leadEmailText(null)).toBe("Não informado");
    expect(leadEmailText(null, "Sem e-mail")).toBe("Sem e-mail");
    expect(leadEmailHref(null)).toBeNull();
  });

  it("creates mailto only for an existing email", () => {
    expect(leadEmailHref("lead@example.invalid")).toBe(
      "mailto:lead@example.invalid",
    );
  });
});
