import { Alert, Badge, Card, Label } from "@devora/ui";
import Link from "next/link";
import { hasPermission } from "../../../lib/auth/permissions";
import { requireCrmAccess } from "../../../lib/crm/access";
import {
  classifyDueDate,
  formatOperationDate,
  taskStatusLabels,
} from "../../../lib/crm/activity-task";
import { transitionCrmTask } from "../../../lib/crm/activity-task-actions";
import { taskFiltersSchema } from "../../../lib/crm/activity-task-validation";
import { createClient } from "../../../lib/supabase/server";
const PAGE_SIZE = 20;
export const dynamic = "force-dynamic";
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireCrmAccess();
  const canWrite = await hasPermission("crm.write", access.organization.id);
  const parsed = taskFiltersSchema.safeParse(await searchParams);
  const filters = parsed.success ? parsed.data : { page: 1 };
  const supabase = await createClient();
  const start = (filters.page - 1) * PAGE_SIZE;
  let query = supabase
    .from("crm_tasks")
    .select(
      "id,title,due_at,status,version,assigned_membership_id,lead_id,opportunity_id",
      { count: "exact" },
    )
    .eq("organization_id", access.organization.id)
    .order("due_at")
    .range(start, start + PAGE_SIZE - 1);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.assignee)
    query = query.eq("assigned_membership_id", filters.assignee);
  const now = new Date();
  const todayStart = new Date(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now) + "T00:00:00-03:00",
  );
  const tomorrow = new Date(todayStart.getTime() + 86400000);
  if (filters.due === "overdue")
    query = query
      .lt("due_at", todayStart.toISOString())
      .eq("status", "pending");
  if (filters.due === "today")
    query = query
      .gte("due_at", todayStart.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .eq("status", "pending");
  if (filters.due === "upcoming")
    query = query.gte("due_at", tomorrow.toISOString()).eq("status", "pending");
  const [
    { data: tasks, count, error },
    { data: members },
    { data: pendingLinks },
    { data: activeLeads },
    { data: openOpportunities },
  ] = await Promise.all([
    query,
    supabase
      .from("organization_members")
      .select("id,user_id")
      .eq("organization_id", access.organization.id)
      .eq("status", "active"),
    supabase
      .from("crm_tasks")
      .select("lead_id,opportunity_id,due_at")
      .eq("organization_id", access.organization.id)
      .eq("status", "pending")
      .limit(1000),
    supabase
      .from("leads")
      .select("id")
      .eq("organization_id", access.organization.id)
      .is("archived_at", null)
      .limit(1000),
    supabase
      .from("opportunities")
      .select("id")
      .eq("organization_id", access.organization.id)
      .is("closed_at", null)
      .is("archived_at", null)
      .limit(1000),
  ]);
  const leadSet = new Set(
    (pendingLinks ?? []).flatMap((v) => (v.lead_id ? [v.lead_id] : [])),
  );
  const opportunitySet = new Set(
    (pendingLinks ?? []).flatMap((v) =>
      v.opportunity_id ? [v.opportunity_id] : [],
    ),
  );
  const pending = pendingLinks ?? [];
  const metrics = [
    [
      "Vencidas",
      pending.filter((v) => classifyDueDate(v.due_at, now) === "overdue")
        .length,
    ],
    [
      "Para hoje",
      pending.filter((v) => classifyDueDate(v.due_at, now) === "today").length,
    ],
    ["Pendentes", pending.length],
    [
      "Leads sem próxima ação",
      (activeLeads ?? []).filter((v) => !leadSet.has(v.id)).length,
    ],
    [
      "Oportunidades abertas sem próxima ação",
      (openOpportunities ?? []).filter((v) => !opportunitySet.has(v.id)).length,
    ],
  ];
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Operação diária</p>
          <h1>Tarefas comerciais</h1>
          <p>Horários apresentados em America/Sao_Paulo.</p>
        </div>
      </header>
      <section className="crm-metrics" aria-label="Indicadores de tarefas">
        {metrics.map(([label, value]) => (
          <Card key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </section>
      <form className="crm-filters">
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">Todos</option>
            {Object.entries(taskStatusLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="due">Vencimento</Label>
          <select id="due" name="due" defaultValue={filters.due ?? ""}>
            <option value="">Todos</option>
            <option value="overdue">Vencidas</option>
            <option value="today">Hoje</option>
            <option value="upcoming">Próximas</option>
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
            {(members ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                Membro {v.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Filtrar</button>
      </form>
      {error ? (
        <Alert variant="error">Não foi possível consultar as tarefas.</Alert>
      ) : tasks?.length ? (
        <ul className="crm-task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <div>
                <strong>{task.title}</strong>
                <span>
                  <Badge
                    variant={
                      task.status === "completed"
                        ? "success"
                        : task.status === "cancelled"
                          ? "error"
                          : "info"
                    }
                  >
                    {taskStatusLabels[task.status]}
                  </Badge>{" "}
                  {formatOperationDate(task.due_at)}
                </span>
                <span>
                  {task.lead_id ? (
                    <Link href={`/crm/leads/${task.lead_id}`}>Abrir lead</Link>
                  ) : task.opportunity_id ? (
                    <Link href={`/crm/opportunities/${task.opportunity_id}`}>
                      Abrir oportunidade
                    </Link>
                  ) : (
                    "Entidade comercial"
                  )}
                </span>
              </div>
              {canWrite ? (
                <form action={transitionCrmTask}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="version" value={task.version} />
                  <input type="hidden" name="returnTo" value="/crm/tasks" />
                  {task.status === "pending" ? (
                    <>
                      <button name="status" value="completed">
                        Concluir
                      </button>
                      <button name="status" value="cancelled">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button name="status" value="pending">
                      Reabrir
                    </button>
                  )}
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Alert variant="info">Nenhuma tarefa corresponde aos filtros.</Alert>
      )}
      <nav className="crm-pagination" aria-label="Paginação">
        <span>Página {filters.page}</span>
        <div>
          {filters.page > 1 ? (
            <Link href={`?page=${filters.page - 1}`}>Anterior</Link>
          ) : null}
          {(count ?? 0) > filters.page * PAGE_SIZE ? (
            <Link href={`?page=${filters.page + 1}`}>Próxima</Link>
          ) : null}
        </div>
      </nav>
    </>
  );
}
