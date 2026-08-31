import { z } from "zod";

export const dashboardPeriodSchema = z.coerce
  .number()
  .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))
  .catch(30);

export const clientFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  q: z.string().trim().max(120).optional(),
  state: z.enum(["active", "archived"]).optional(),
  assignee: z.string().uuid().optional(),
  period: z.coerce
    .number()
    .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))
    .optional(),
});

const stageMetric = z.object({
  stage: z.string(),
  count: z.number(),
  value: z.number(),
});
const lossMetric = z.object({ reason: z.string(), count: z.number() });
export const crmDashboardSchema = z.object({
  periodDays: z.number(),
  activeLeads: z.number(),
  openOpportunities: z.number(),
  openPipelineValue: z.number(),
  wonOpportunities: z.number(),
  lostOpportunities: z.number(),
  convertedClients: z.number(),
  conversionRate: z.number(),
  overdueTasks: z.number(),
  tasksDueToday: z.number(),
  leadsWithoutNextAction: z.number(),
  opportunitiesWithoutNextAction: z.number(),
  pipelineByStage: z.array(stageMetric),
  lossReasons: z.array(lossMetric),
});

const clientItem = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  contactName: z.string().nullable(),
  state: z.enum(["active", "archived"]),
  convertedAt: z.string(),
  sourceOpportunityTitle: z.string(),
});
export const clientListSchema = z.object({
  total: z.number(),
  items: z.array(clientItem),
});

export const lossReasonDashboardLabels: Record<string, string> = {
  price: "Preço",
  timing: "Momento inadequado",
  no_response: "Sem resposta",
  competitor: "Concorrente",
  scope_mismatch: "Escopo incompatível",
  other: "Outro",
  not_informed: "Não informado",
};
