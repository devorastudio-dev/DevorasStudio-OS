import { describe, expect, it } from "vitest";
import {
  clientFiltersSchema,
  crmDashboardSchema,
  dashboardPeriodSchema,
} from "./clients";

describe("client and dashboard validation", () => {
  it("accepts only supported dashboard periods", () => {
    expect(dashboardPeriodSchema.parse("7")).toBe(7);
    expect(dashboardPeriodSchema.parse("365")).toBe(30);
  });
  it("rejects invalid client filters safely", () => {
    expect(clientFiltersSchema.parse({ page: "-1" }).page).toBe(1);
    expect(clientFiltersSchema.safeParse({ assignee: "invalid" }).success).toBe(
      false,
    );
  });
  it("validates the aggregate contract without arbitrary rows", () => {
    expect(
      crmDashboardSchema.parse({
        periodDays: 30,
        activeLeads: 1,
        openOpportunities: 2,
        openPipelineValue: 500,
        wonOpportunities: 1,
        lostOpportunities: 0,
        convertedClients: 1,
        conversionRate: 100,
        overdueTasks: 0,
        tasksDueToday: 1,
        leadsWithoutNextAction: 1,
        opportunitiesWithoutNextAction: 1,
        pipelineByStage: [],
        lossReasons: [],
      }).conversionRate,
    ).toBe(100);
  });
});
