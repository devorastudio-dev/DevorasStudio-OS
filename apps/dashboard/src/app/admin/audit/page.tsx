import { Alert, Button, Card, Input, Label } from "@devora/ui";
import { redirect } from "next/navigation";

import { parseAuditFilters } from "../../../lib/audit/filters";
import { recordAuditEvent } from "../../../lib/audit/record";
import { requireDashboardAccess } from "../../../lib/auth/access";
import { hasPermission } from "../../../lib/auth/permissions";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
const pageSize = 25;

export default async function AuditPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const access = await requireDashboardAccess();
  if (!(await hasPermission("audit.read", access.organization.id))) {
    await recordAuditEvent({
      action: "auth.access.denied",
      outcome: "denied",
      metadata: { capability: "audit.read" },
    });
    redirect("/");
  }
  const parsed = parseAuditFilters(await searchParams);
  if (!parsed.success)
    return (
      <main className="p-6">
        <Alert variant="error">Filtros invalidos.</Alert>
      </main>
    );
  const filters = parsed.data;
  const start = (filters.page - 1) * pageSize;
  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select(
      "id,action,outcome,actor_user_id,entity_type,entity_id,request_id,created_at",
      { count: "exact" },
    )
    .eq("organization_id", access.organization.id)
    .order("created_at", { ascending: false })
    .range(start, start + pageSize - 1);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.outcome) query = query.eq("outcome", filters.outcome);
  if (filters.actor) query = query.eq("actor_user_id", filters.actor);
  if (filters.entity) query = query.eq("entity_id", filters.entity);
  if (filters.from)
    query = query.gte("created_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to)
    query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
  const { data, error, count } = await query;
  return (
    <main className="min-h-screen px-4 py-10">
      <Card className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Auditoria</h1>
          <p className="text-sm text-text-muted">
            Eventos de seguranca e administracao, mais recentes primeiro.
          </p>
        </header>
        <form className="grid gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="action">Acao</Label>
            <Input id="action" name="action" defaultValue={filters.action} />
          </div>
          <div>
            <Label htmlFor="outcome">Resultado</Label>
            <select
              className="h-10 w-full rounded-md border border-border bg-surface px-3"
              defaultValue={filters.outcome ?? ""}
              id="outcome"
              name="outcome"
            >
              <option value="">Todos</option>
              <option value="success">Sucesso</option>
              <option value="failure">Falha</option>
              <option value="denied">Negado</option>
            </select>
          </div>
          <div>
            <Label htmlFor="actor">Ator (UUID)</Label>
            <Input id="actor" name="actor" defaultValue={filters.actor} />
          </div>
          <div>
            <Label htmlFor="entity">Entidade (UUID)</Label>
            <Input id="entity" name="entity" defaultValue={filters.entity} />
          </div>
          <div>
            <Label htmlFor="from">De</Label>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={filters.from}
            />
          </div>
          <div>
            <Label htmlFor="to">Ate</Label>
            <Input id="to" name="to" type="date" defaultValue={filters.to} />
          </div>
          <Button type="submit">Filtrar</Button>
        </form>
        {error ? (
          <Alert variant="error">Nao foi possivel consultar a auditoria.</Alert>
        ) : data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Acao</th>
                  <th>Resultado</th>
                  <th>Ator</th>
                  <th>Entidade</th>
                </tr>
              </thead>
              <tbody>
                {data.map((event) => (
                  <tr className="border-t border-border" key={event.id}>
                    <td className="py-3">
                      {new Date(event.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td>{event.action}</td>
                    <td>{event.outcome}</td>
                    <td>{event.actor_user_id?.slice(0, 8) ?? "Sistema"}</td>
                    <td>
                      {event.entity_type
                        ? `${event.entity_type} ${event.entity_id?.slice(0, 8) ?? ""}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Alert variant="warning">Nenhum evento encontrado.</Alert>
        )}
        <nav aria-label="Paginacao da auditoria" className="flex gap-4">
          <span>
            Pagina {filters.page} de{" "}
            {Math.max(1, Math.ceil((count ?? 0) / pageSize))}
          </span>
          {filters.page > 1 ? (
            <a href={`?page=${filters.page - 1}`}>Anterior</a>
          ) : null}
          {start + pageSize < (count ?? 0) ? (
            <a href={`?page=${filters.page + 1}`}>Proxima</a>
          ) : null}
        </nav>
      </Card>
    </main>
  );
}
