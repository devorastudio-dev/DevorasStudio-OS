import { describe, expect, it } from "vitest";
import {
  CRM_SOURCES,
  CRM_TRIAGE,
  sourceLabels,
  triageLabels,
} from "./constants";
describe("catalogos do CRM", () => {
  it("mantem origens controladas", () => {
    expect(CRM_SOURCES).toContain("website");
    expect(CRM_SOURCES).toContain("99freelas");
    expect(Object.keys(sourceLabels)).toHaveLength(CRM_SOURCES.length);
  });
  it("limita triagem sem antecipar pipeline", () => {
    expect(CRM_TRIAGE).toEqual([
      "new",
      "in_review",
      "qualified",
      "disqualified",
    ]);
    expect(Object.keys(triageLabels)).toHaveLength(4);
  });
});
