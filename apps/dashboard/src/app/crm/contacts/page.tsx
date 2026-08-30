import { Alert, Badge } from "@devora/ui";
import Link from "next/link";
import { requireCrmAccess } from "../../../lib/crm/access";
import { createClient } from "../../../lib/supabase/server";
import { crmFiltersSchema } from "../../../lib/crm/validation";
import { CrmFilters } from "../_components/filters";
import { Pagination } from "../_components/pagination";
export const dynamic = "force-dynamic";
const pageSize = 20;
export default async function ContactsPage({
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
    .from("crm_contacts")
    .select("id,full_name,email,phone,job_title,is_primary,state,company_id", {
      count: "exact",
    })
    .eq("organization_id", access.organization.id)
    .order("full_name")
    .range(start, start + pageSize - 1);
  if (filters.q)
    query = query.or(
      `full_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%,phone.ilike.%${filters.q}%`,
    );
  if (filters.state) query = query.eq("state", filters.state);
  if (filters.company) query = query.eq("company_id", filters.company);
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
          <h1>Contatos</h1>
          <p>Pessoas vinculadas ou independentes de uma empresa.</p>
        </div>
        <Link className="crm-primary-link" href="/crm/contacts/new">
          Novo contato
        </Link>
      </header>
      <CrmFilters
        kind="contacts"
        defaults={{ q: filters.q, state: filters.state }}
      />
      {error ? (
        <Alert variant="error">Não foi possível consultar os contatos.</Alert>
      ) : data?.length ? (
        <div className="crm-card-list">
          {data.map((v) => (
            <Link
              href={`/crm/contacts/${v.id}`}
              key={v.id}
              className="crm-list-card"
            >
              <div>
                <strong>{v.full_name}</strong>
                <span>
                  {v.job_title ??
                    v.email ??
                    v.phone ??
                    "Sem contato complementar"}
                </span>
              </div>
              <div className="crm-badges">
                {v.is_primary ? <Badge variant="info">Principal</Badge> : null}
                <Badge variant={v.state === "active" ? "success" : "neutral"}>
                  {v.state === "active" ? "Ativo" : "Arquivado"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Alert variant="warning">Nenhum contato corresponde aos filtros.</Alert>
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
