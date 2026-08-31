import { describe, expect, it } from "vitest";
import { itemSchema, proposalSchema, serviceSchema } from "./validation";
describe("proposal validation", () => {
  it("accepts decimal money and fractional quantity", () => {
    expect(
      serviceSchema.parse({
        id: "",
        name: "Consultoria",
        description: "",
        unit: "hour",
        price: "150.50",
        active: true,
      }).price,
    ).toBe(150.5);
    expect(
      itemSchema.parse({
        proposalId: "11111111-1111-4111-8111-111111111111",
        itemId: "",
        serviceId: "",
        name: "Item custom",
        description: "",
        quantity: "1.5",
        unit: "hour",
        unitPrice: "100",
      }).quantity,
    ).toBe(1.5);
  });
  it("rejects malformed money", () =>
    expect(
      serviceSchema.safeParse({
        id: "",
        name: "Teste",
        unit: "unit",
        price: "1.999",
        active: true,
      }).success,
    ).toBe(false));
  it("requires a client", () =>
    expect(
      proposalSchema.safeParse({
        clientId: "",
        opportunityId: "",
        title: "Proposta",
        validUntil: "",
      }).success,
    ).toBe(false));
  it("rejects incomplete custom items and updates", () => {
    const base = {
      proposalId: "11111111-1111-4111-8111-111111111111",
      itemId: "22222222-2222-4222-8222-222222222222",
      serviceId: "",
      name: "",
      description: "",
      quantity: "1",
      unit: undefined,
      unitPrice: "",
    };

    expect(itemSchema.safeParse(base).success).toBe(false);
    expect(itemSchema.safeParse({ ...base, quantity: "0" }).success).toBe(
      false,
    );
    expect(itemSchema.safeParse({ ...base, quantity: "abc" }).success).toBe(
      false,
    );
    expect(itemSchema.safeParse({ ...base, unitPrice: "-1" }).success).toBe(
      false,
    );
  });
});
