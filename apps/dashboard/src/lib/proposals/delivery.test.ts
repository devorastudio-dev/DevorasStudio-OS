import { describe, expect, it } from "vitest";
import {
  createDeliveryToken,
  escapeEmailHtml,
  hashDeliveryToken,
  proposalDecisionSchema,
} from "./delivery";
describe("proposal delivery security", () => {
  it("creates unpredictable tokens and stores only deterministic SHA-256", () => {
    const one = createDeliveryToken(),
      two = createDeliveryToken();
    expect(one).not.toBe(two);
    expect(one.length).toBeGreaterThanOrEqual(40);
    expect(hashDeliveryToken(one)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashDeliveryToken(one)).not.toContain(one);
  });
  it("requires explicit consent and a responsible person", () => {
    expect(
      proposalDecisionSchema.safeParse({
        token: createDeliveryToken(),
        decision: "accepted",
        name: "",
        email: "",
        reason: "",
        consent: "",
      }).success,
    ).toBe(false);
  });
  it("escapes optional email copy", () =>
    expect(escapeEmailHtml('<script>"x"</script>')).toBe(
      "&lt;script&gt;&quot;x&quot;&lt;/script&gt;",
    ));
});
