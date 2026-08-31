import Link from "next/link";
import { Alert, Card } from "@devora/ui";
import { requireCrmAccess } from "../../lib/crm/access";
import {
  crmDashboardSchema,
  dashboardPeriodSchema,
  lossReasonDashboardLabels,
} from "../../lib/crm/clients";
import { createClient } from "../../lib/supabase/server";
export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export default async function CrmOverview({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireCrmAccess();
  const period = dashboardPeriodSchema.parse((await searchParams).period);
  const supabase = await createClient();
  const response = await supabase.rpc("get_crm_dashboard", {
    period_days: period,
  });
  const parsed = crmDashboardSchema.safeParse(response.data);
  const dashboard = parsed.success ? parsed.data : null;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Visão geral</p>
          <h1>Painel comercial</h1>
          <p>Operação atual e resultados dos últimos {period} dias.</p>
        </div>
        <form>
          <label htmlFor="period">Período</label>
          <select id="period" name="period" defaultValue={period}>
            {[7, 30, 90].map((v) => (
              <option key={v} value={v}>
                {v} dias
              </option>
            ))}
          </select>
          <button type="submit">Aplicar</button>
        </form>
      </header>
      {response.error || !dashboard ? (
        <Alert variant="error">
          Não foi possível calcular os indicadores comerciais.
        </Alert>
      ) : (
        <>
          <section aria-label="Indicadores comerciais" className="crm-metrics">
            {[
              ["Leads ativos", dashboard.activeLeads],
              ["Oportunidades abertas", dashboard.openOpportunities],
              ["Pipeline aberto", money.format(dashboard.openPipelineValue)],
              ["Ganhos no período", dashboard.wonOpportunities],
              ["Perdidos no período", dashboard.lostOpportunities],
              ["Clientes convertidos", dashboard.convertedClients],
              ["Taxa de conversão", `${dashboard.conversionRate}%`],
            ].map(([label, value]) => (
              <Card key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </Card>
            ))}
          </section>
          <section className="crm-grid">
            <Card>
              <h2>Próximas ações</h2>
              <dl className="crm-details">
                <dt>Tarefas vencidas</dt>
                <dd>{dashboard.overdueTasks}</dd>
                <dt>Tarefas para hoje</dt>
                <dd>{dashboard.tasksDueToday}</dd>
                <dt>Leads sem próxima ação</dt>
                <dd>{dashboard.leadsWithoutNextAction}</dd>
                <dt>Oportunidades sem próxima ação</dt>
                <dd>{dashboard.opportunitiesWithoutNextAction}</dd>
              </dl>
              <Link href="/crm/tasks">Abrir tarefas</Link>
            </Card>
            <Card>
              <h2>Pipeline por etapa</h2>
              {dashboard.pipelineByStage.length ? (
                <ul className="pipeline-history">
                  {dashboard.pipelineByStage.map((v) => (
                    <li key={v.stage}>
                      <strong>
                        {v.stage}: {v.count}
                      </strong>
                      <span>{money.format(v.value)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Sem oportunidades abertas.</p>
              )}
              <Link href="/crm/pipeline">Abrir pipeline</Link>
            </Card>
            <Card>
              <h2>Motivos de perda</h2>
              {dashboard.lossReasons.length ? (
                <ul className="pipeline-history">
                  {dashboard.lossReasons.map((v) => (
                    <li key={v.reason}>
                      <strong>
                        {lossReasonDashboardLabels[v.reason] ?? v.reason}
                      </strong>
                      <span>{v.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Sem perdas no período.</p>
              )}
            </Card>
          </section>
          <p className="crm-helper">
            Taxa de conversão = clientes convertidos ÷ oportunidades encerradas
            (ganhas + perdidas) no período.
          </p>
        </>
      )}
    </>
  );
}
