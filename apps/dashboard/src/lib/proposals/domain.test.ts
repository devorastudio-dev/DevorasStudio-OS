import { describe, expect, it } from "vitest";
import {
  formatMoney,
  isDraft,
  proposalStatusLabels,
  unitLabels,
} from "./domain";

describe("proposal domain", () => {
  it("formats BRL without storing the formatted value", () => {
    expect(formatMoney("1500.50")).toContain("1.500,50");
  });

  it("centralizes the editable state", () => {
    expect(isDraft("draft")).toBe(true);
    for (const status of Object.keys(proposalStatusLabels).filter(
      (value) => value !== "draft",
    )) {
      expect(isDraft(status)).toBe(false);
    }
  });

  it("provides pt-BR labels for every controlled unit", () => {
    expect(Object.keys(unitLabels)).toEqual([
      "project",
      "hour",
      "month",
      "unit",
      "custom",
    ]);
  });
});
