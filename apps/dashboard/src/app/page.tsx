import {
  ArrowRight,
  CheckSquare,
  FileText,
  Kanban,
  UserPlus,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import { Alert, Card } from "@devora/ui";
import Link from "next/link";
import { AppShell } from "../components/app-shell/app-shell";
import { PageHeader } from "../components/page/page-header";
import { requireDashboardAccess } from "../lib/auth/access";
import { hasPermission } from "../lib/auth/permissions";
import { createProposalsDb } from "../lib/proposals/db";
import { createClient } from "../lib/supabase/server";
export const dynamic = "force-dynamic";
type Dashboard = {
  activeLeads: number;
  openOpportunities: number;
  convertedClients: number;
  overdueTasks: number;
  tasksDueToday: number;
  leadsWithoutNextAction: number;
  opportunitiesWithoutNextAction: number;
  pipelineByStage: Array<{ stage: string; count: number; value: number }>;
};
export default async function DashboardHome() {
  const access = await requireDashboardAccess();
  const [canReadCrm, canWriteCrm, canReadProposals, canWriteProposals] =
    await Promise.all([
      hasPermission("crm.read", access.organization.id),
      hasPermission("crm.write", access.organization.id),
      hasPermission("proposals.read", access.organization.id),
      hasPermission("proposals.write", access.organization.id),
    ]);
  const supabase = await createClient();
  const crmResult = canReadCrm
    ? await supabase.rpc("get_crm_dashboard", { period_days: 30 })
    : { data: null, error: null };
  let draftCount = 0;
  if (canReadProposals) {
    const db = await createProposalsDb();
    const result = await db
      .from("proposals")
      .select("id")
      .eq("organization_id", access.organization.id)
      .eq("status", "draft");
    draftCount = Array.isArray(result.data) ? result.data.length : 0;
  }
  const dashboard = crmResult.data as Dashboard | null;
  const attention =
    (dashboard?.overdueTasks ?? 0) +
    (dashboard?.tasksDueToday ?? 0) +
    (dashboard?.leadsWithoutNextAction ?? 0) +
    (dashboard?.opportunitiesWithoutNextAction ?? 0);
  return (
    <AppShell access={access}>
      <PageHeader
        eyebrow="Visão geral"
        title={`Olá, ${access.profileName?.split(" ")[0] ?? "bem-vinda"}`}
        description="Acompanhe a operação comercial e veja o que precisa de atenção hoje."
        actions={
          <div className="quick-actions">
            {canWriteCrm ? (
              <>
                <Link
                  className="dv-button dv-button--primary dv-button--md"
                  href="/crm/leads/new"
                >
                  <UserPlus size={18} aria-hidden /> Novo lead
                </Link>
                <Link
                  className="dv-button dv-button--secondary dv-button--md"
                  href="/crm/tasks"
                >
                  <CheckSquare size={18} aria-hidden /> Nova tarefa
                </Link>
              </>
            ) : null}
            {canWriteProposals ? (
              <Link
                className="dv-button dv-button--secondary dv-button--md"
                href="/proposals/new"
              >
                <FileText size={18} aria-hidden /> Nova proposta
              </Link>
            ) : null}
          </div>
        }
      />
      {crmResult.error ? (
        <Alert variant="error">
          Não foi possível carregar os indicadores comerciais.
        </Alert>
      ) : null}
      <section aria-labelledby="overview-metrics">
        <h2 className="section-title" id="overview-metrics">
          Visão operacional
        </h2>
        <div className="metric-grid">
          {canReadCrm ? (
            <>
              <Metric
                icon={Users}
                label="Leads ativos"
                value={dashboard?.activeLeads ?? 0}
                href="/crm/leads"
              />
              <Metric
                icon={Kanban}
                label="Oportunidades abertas"
                value={dashboard?.openOpportunities ?? 0}
                href="/crm/pipeline"
              />
              <Metric
                icon={Users}
                label="Clientes convertidos"
                value={dashboard?.convertedClients ?? 0}
                href="/crm/clients"
              />
              <Metric
                icon={CheckSquare}
                label="Tarefas atrasadas"
                value={dashboard?.overdueTasks ?? 0}
                href="/crm/tasks?view=overdue"
                tone={(dashboard?.overdueTasks ?? 0) > 0 ? "danger" : "default"}
              />
            </>
          ) : null}
          {canReadProposals ? (
            <Metric
              icon={FileText}
              label="Propostas em rascunho"
              value={draftCount}
              href="/proposals?status=draft"
            />
          ) : null}
        </div>
      </section>
      {canReadCrm ? (
        <div className="dashboard-grid">
          <Card className="dashboard-panel">
            <div className="section-heading">
              <div>
                <p className="page-eyebrow">Prioridades</p>
                <h2>Precisa de atenção</h2>
              </div>
              <span className="attention-count">{attention}</span>
            </div>
            <Attention
              label="Tarefas atrasadas"
              value={dashboard?.overdueTasks ?? 0}
              href="/crm/tasks?view=overdue"
            />
            <Attention
              label="Tarefas para hoje"
              value={dashboard?.tasksDueToday ?? 0}
              href="/crm/tasks?view=today"
            />
            <Attention
              label="Leads sem próxima ação"
              value={dashboard?.leadsWithoutNextAction ?? 0}
              href="/crm/leads"
            />
            <Attention
              label="Oportunidades sem próxima ação"
              value={dashboard?.opportunitiesWithoutNextAction ?? 0}
              href="/crm/pipeline"
            />
          </Card>
          <Card className="dashboard-panel">
            <div className="section-heading">
              <div>
                <p className="page-eyebrow">Comercial</p>
                <h2>Pipeline por etapa</h2>
              </div>
              <Link href="/crm/pipeline">Ver pipeline</Link>
            </div>
            {dashboard?.pipelineByStage?.length ? (
              <div className="pipeline-summary">
                {dashboard.pipelineByStage.map((stage) => (
                  <div key={stage.stage}>
                    <span>{stage.stage}</span>
                    <div>
                      <i
                        style={{
                          width: `${Math.max(4, Math.min(100, stage.count * 12))}%`,
                        }}
                      />
                      <b>{stage.count}</b>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">
                Nenhuma oportunidade aberta. Use o CRM para iniciar o fluxo
                comercial.
              </p>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <h2>Comece pela operação comercial</h2>
          <p className="muted-copy">
            Seu perfil não possui acesso ao CRM. Os módulos disponíveis
            continuam acessíveis pelo menu.
          </p>
        </Card>
      )}
    </AppShell>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  href,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href: string;
  tone?: "default" | "danger";
}) {
  return (
    <Link className={`metric-card metric-${tone}`} href={href}>
      <span className="metric-icon">
        <Icon size={21} aria-hidden />
      </span>
      <span>{label}</span>
      <strong>{new Intl.NumberFormat("pt-BR").format(value)}</strong>
      <ArrowRight size={17} aria-hidden />
    </Link>
  );
}
function Attention({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link className="attention-row" href={href}>
      <span>
        <strong>{label}</strong>
        <small>
          {value === 0
            ? "Tudo em dia"
            : `${value} ${value === 1 ? "item" : "itens"}`}
        </small>
      </span>
      <ArrowRight size={18} aria-hidden />
    </Link>
  );
}
