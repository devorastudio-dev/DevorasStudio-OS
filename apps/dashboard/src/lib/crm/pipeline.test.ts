import { describe, expect, it } from "vitest";
import {
  categoryLabels,
  formatEstimatedValue,
  lossReasonLabels,
  LOSS_REASONS,
} from "./pipeline";

describe("apresentacao do pipeline comercial", () => {
  it("mantem motivos de perda com rotulos explicitos", () => {
    expect(LOSS_REASONS).toContain("other");
    expect(lossReasonLabels.other).toBe("Outro");
    expect(categoryLabels.won).toBe("Ganha");
  });

  it("formata valores em reais sem inventar valor ausente", () => {
    expect(formatEstimatedValue(null)).toBe("Valor não informado");
    expect(formatEstimatedValue(1250.5)).toMatch(/1\.250,50/);
  });
});
