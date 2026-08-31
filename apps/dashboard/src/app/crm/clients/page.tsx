import Link from "next/link";
import { Alert, Badge, Button, Input, Label } from "@devora/ui";
import { requireCrmAccess } from "../../../lib/crm/access";
import {
  clientFiltersSchema,
  clientListSchema,
} from "../../../lib/crm/clients";
import { createClient } from "../../../lib/supabase/server";
import { Pagination } from "../_components/pagination";
export const dynamic = "force-dynamic";
const pageSize = 20;
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCrmAccess();
  const raw = await searchParams;
  const parsed = clientFiltersSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : clientFiltersSchema.parse({});
  const supabase = await createClient();
  const response = await supabase.rpc("list_crm_clients", {
    search_text: filters.q,
    client_state: filters.state,
    assigned_to: filters.assignee,
    period_days: filters.period,
    page_number: filters.page,
    page_size: pageSize,
  });
  const result = clientListSchema.safeParse(response.data);
  const list = result.success ? result.data : null;
  const params = new URLSearchParams();
  Object.entries(raw).forEach(([k, v]) => {
    if (typeof v === "string") params.set(k, v);
  });
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Base comercial</p>
          <h1>Clientes</h1>
          <p>Relacionamentos confirmados a partir de oportunidades ganhas.</p>
        </div>
      </header>
      <form className="crm-filters">
        <div>
          <Label htmlFor="q">Buscar</Label>
          <Input
            id="q"
            name="q"
            defaultValue={filters.q}
            placeholder="Empresa, contato ou lead"
          />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <select id="state" name="state" defaultValue={filters.state ?? ""}>
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="archived">Arquivados</option>
          </select>
        </div>
        <div>
          <Label htmlFor="period">Conversão</Label>
          <select id="period" name="period" defaultValue={filters.period ?? ""}>
            <option value="">Todo período</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
        </div>
        <Button type="submit">Filtrar</Button>
      </form>
      {response.error || !list ? (
        <Alert variant="error">Não foi possível consultar os clientes.</Alert>
      ) : list.items.length ? (
        <div className="crm-card-list">
          {list.items.map((item) => (
            <Link
              key={item.id}
              href={`/crm/clients/${item.id}`}
              className="crm-list-card"
            >
              <div>
                <strong>{item.displayName}</strong>
                <span>
                  {item.sourceOpportunityTitle} · convertido em{" "}
                  {new Date(item.convertedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <Badge variant={item.state === "active" ? "success" : "neutral"}>
                {item.state === "active" ? "Ativo" : "Arquivado"}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <Alert variant="warning">Nenhum cliente corresponde aos filtros.</Alert>
      )}
      <Pagination
        page={filters.page}
        count={list?.total ?? 0}
        pageSize={pageSize}
        params={params}
      />
    </>
  );
}
