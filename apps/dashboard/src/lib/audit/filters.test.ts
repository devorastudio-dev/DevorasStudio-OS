import { describe, expect, it } from "vitest";
import { parseAuditFilters } from "./filters";

describe("audit filters", () => {
  it("accepts bounded filters", () => {
    expect(
      parseAuditFilters({ from: "2026-01-01", to: "2026-03-01", page: "2" })
        .success,
    ).toBe(true);
  });
  it("rejects periods over 90 days", () => {
    expect(
      parseAuditFilters({ from: "2025-01-01", to: "2026-01-01" }).success,
    ).toBe(false);
  });
  it("rejects invalid filters", () => {
    expect(parseAuditFilters({ actor: "not-a-uuid", page: "0" }).success).toBe(
      false,
    );
  });
});
