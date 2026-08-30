import { Alert, Badge, Card, Label } from "@devora/ui";
import Link from "next/link";
import { requireCrmAccess } from "../../../lib/crm/access";
import {
  categoryLabels,
  formatEstimatedValue,
} from "../../../lib/crm/pipeline";
import { pipelineFiltersSchema } from "../../../lib/crm/pipeline-validation";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireCrmAccess();
  const parsed = pipelineFiltersSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : {};
  const supabase = await createClient();
  const [{ data: stages, error: stageError }, { data: members }] =
    await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id,name,position,category")
        .eq("organization_id", access.organization.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("organization_members")
        .select("id,user_id")
        .eq("organization_id", access.organization.id)
        .eq("status", "active"),
    ]);
  let opportunitiesQuery = supabase
    .from("opportunities")
    .select(
      "id,title,stage_id,assigned_membership_id,estimated_value,updated_at",
    )
    .eq("organization_id", access.organization.id)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (filters.stage)
    opportunitiesQuery = opportunitiesQuery.eq("stage_id", filters.stage);
  if (filters.assignee)
    opportunitiesQuery = opportunitiesQuery.eq(
      "assigned_membership_id",
      filters.assignee,
    );
  const { data: opportunities, error: opportunityError } =
    await opportunitiesQuery;
  const visibleStages = (stages ?? []).filter(
    (stage) =>
      (!filters.stage || stage.id === filters.stage) &&
      (!filters.category || stage.category === filters.category),
  );
  const totalValue = (opportunities ?? []).reduce(
    (sum, item) => sum + (item.estimated_value ?? 0),
    0,
  );
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Pipeline</p>
          <h1>Oportunidades comerciais</h1>
          <p>
            Funil real da organização, limitado às 200 atualizações mais
            recentes.
          </p>
        </div>
      </header>
      <section aria-label="Indicadores do pipeline" className="crm-metrics">
        <Card>
          <span>Oportunidades exibidas</span>
          <strong>{opportunities?.length ?? 0}</strong>
        </Card>
        <Card>
          <span>Valor estimado exibido</span>
          <strong>{formatEstimatedValue(totalValue)}</strong>
        </Card>
      </section>
      <form className="crm-filters" aria-label="Filtros do pipeline">
        <div>
          <Label htmlFor="stage">Etapa</Label>
          <select id="stage" name="stage" defaultValue={filters.stage ?? ""}>
            <option value="">Todas</option>
            {(stages ?? []).map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="category">Estado</Label>
          <select
            id="category"
            name="category"
            defaultValue={filters.category ?? ""}
          >
            <option value="">Todos</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="assignee">Responsável</Label>
          <select
            id="assignee"
            name="assignee"
            defaultValue={filters.assignee ?? ""}
          >
            <option value="">Todos</option>
            {(members ?? []).map((member) => (
              <option key={member.id} value={member.id}>
                Membro {member.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="pipeline-filter-submit">Aplicar</Label>
          <button id="pipeline-filter-submit" type="submit">
            Filtrar
          </button>
        </div>
      </form>
      {stageError || opportunityError ? (
        <Alert variant="error">Não foi possível consultar o pipeline.</Alert>
      ) : visibleStages.length === 0 ? (
        <Alert variant="warning">Nenhuma etapa corresponde aos filtros.</Alert>
      ) : (
        <div className="pipeline-board" aria-label="Quadro do pipeline">
          {visibleStages.map((stage) => {
            const cards = (opportunities ?? []).filter(
              (item) => item.stage_id === stage.id,
            );
            return (
              <section
                className="pipeline-column"
                key={stage.id}
                aria-labelledby={`stage-${stage.id}`}
              >
                <header>
                  <h2 id={`stage-${stage.id}`}>{stage.name}</h2>
                  <Badge
                    variant={
                      stage.category === "won"
                        ? "success"
                        : stage.category === "lost"
                          ? "error"
                          : "info"
                    }
                  >
                    {cards.length}
                  </Badge>
                </header>
                {cards.length ? (
                  cards.map((item) => (
                    <Link
                      className="pipeline-card"
                      href={`/crm/opportunities/${item.id}`}
                      key={item.id}
                    >
                      <strong>{item.title}</strong>
                      <span>{formatEstimatedValue(item.estimated_value)}</span>
                      <small>
                        {item.assigned_membership_id
                          ? `Responsável ${item.assigned_membership_id.slice(0, 8)}`
                          : "Sem responsável"}
                      </small>
                    </Link>
                  ))
                ) : (
                  <p className="pipeline-empty">Nenhuma oportunidade.</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
