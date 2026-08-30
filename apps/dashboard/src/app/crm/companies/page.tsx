import { Alert, Badge } from "@devora/ui";
import Link from "next/link";
import { requireCrmAccess } from "../../../lib/crm/access";
import { createClient } from "../../../lib/supabase/server";
import { crmFiltersSchema } from "../../../lib/crm/validation";
import { CrmFilters } from "../_components/filters";
import { Pagination } from "../_components/pagination";
export const dynamic = "force-dynamic";
const pageSize = 20;
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireCrmAccess();
  const raw = await searchParams;
  const parsed = crmFiltersSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : crmFiltersSchema.parse({});
  const start = (filters.page - 1) * pageSize;
  const supabase = await createClient();
  let query = supabase
    .from("crm_companies")
    .select("id,display_name,email,phone,state,created_at", { count: "exact" })
    .eq("organization_id", access.organization.id)
    .order("display_name")
    .range(start, start + pageSize - 1);
  if (filters.q)
    query = query.ilike("normalized_name", `%${filters.q.toLowerCase()}%`);
  if (filters.state) query = query.eq("state", filters.state);
  const { data, error, count } = await query;
  const params = new URLSearchParams();
  Object.entries(raw).forEach(([k, v]) => {
    if (typeof v === "string") params.set(k, v);
  });
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Base comercial</p>
          <h1>Empresas</h1>
          <p>Empresas comerciais, distintas das organizações tenant.</p>
        </div>
        <Link className="crm-primary-link" href="/crm/companies/new">
          Nova empresa
        </Link>
      </header>
      <CrmFilters
        kind="companies"
        defaults={{ q: filters.q, state: filters.state }}
      />
      {error ? (
        <Alert variant="error">Não foi possível consultar as empresas.</Alert>
      ) : data?.length ? (
        <div className="crm-card-list">
          {data.map((v) => (
            <Link
              href={`/crm/companies/${v.id}`}
              key={v.id}
              className="crm-list-card"
            >
              <div>
                <strong>{v.display_name}</strong>
                <span>{v.email ?? v.phone ?? "Sem contato geral"}</span>
              </div>
              <Badge variant={v.state === "active" ? "success" : "neutral"}>
                {v.state === "active" ? "Ativa" : "Arquivada"}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <Alert variant="warning">
          Nenhuma empresa corresponde aos filtros.
        </Alert>
      )}
      <Pagination
        page={filters.page}
        count={count ?? 0}
        pageSize={pageSize}
        params={params}
      />
    </>
  );
}
