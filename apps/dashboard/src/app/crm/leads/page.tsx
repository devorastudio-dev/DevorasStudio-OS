import { Alert, Badge } from "@devora/ui";
import Link from "next/link";
import { requireCrmAccess } from "../../../lib/crm/access";
import { createClient } from "../../../lib/supabase/server";
import { crmFiltersSchema } from "../../../lib/crm/validation";
import { sourceLabels, triageLabels } from "../../../lib/crm/constants";
import { CrmFilters } from "../_components/filters";
import { Pagination } from "../_components/pagination";
import { leadEmailText } from "../../../lib/crm/lead-presentation";
export const dynamic = "force-dynamic";
const pageSize = 20;
export default async function LeadsPage({
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
    .from("leads")
    .select(
      "id,full_name,email,company,source,triage_status,assigned_membership_id,created_at,archived_at",
      { count: "exact" },
    )
    .eq("organization_id", access.organization.id)
    .order("created_at", { ascending: false })
    .range(start, start + pageSize - 1);
  if (filters.q)
    query = query.or(
      `full_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%,phone.ilike.%${filters.q}%,company.ilike.%${filters.q}%`,
    );
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.triage) query = query.eq("triage_status", filters.triage);
  if (filters.assignee)
    query = query.eq("assigned_membership_id", filters.assignee);
  const { data, error, count } = await query;
  const params = new URLSearchParams();
  Object.entries(raw).forEach(([k, v]) => {
    if (typeof v === "string") params.set(k, v);
  });
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">CRM</p>
          <h1>Leads</h1>
          <p>Captação pública e cadastros manuais em uma fila de triagem.</p>
        </div>
        <Link className="crm-primary-link" href="/crm/leads/new">
          Cadastrar lead
        </Link>
      </header>
      <CrmFilters
        kind="leads"
        defaults={{
          q: filters.q,
          source: filters.source,
          triage: filters.triage,
        }}
      />
      {error ? (
        <Alert variant="error">Não foi possível consultar os leads.</Alert>
      ) : data?.length ? (
        <div className="crm-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Origem</th>
                <th>Triagem</th>
                <th>Responsável</th>
                <th>Recebido</th>
              </tr>
            </thead>
            <tbody>
              {data.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/crm/leads/${lead.id}`}>{lead.full_name}</Link>
                    <small>
                      {lead.company || leadEmailText(lead.email, "Sem e-mail")}
                    </small>
                  </td>
                  <td>
                    {sourceLabels[lead.source as keyof typeof sourceLabels] ??
                      lead.source}
                  </td>
                  <td>
                    <Badge
                      variant={
                        lead.triage_status === "qualified"
                          ? "success"
                          : lead.triage_status === "disqualified"
                            ? "error"
                            : "info"
                      }
                    >
                      {triageLabels[lead.triage_status]}
                    </Badge>
                  </td>
                  <td>
                    {lead.assigned_membership_id
                      ? lead.assigned_membership_id.slice(0, 8)
                      : "Sem responsável"}
                  </td>
                  <td>
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Alert variant="warning">Nenhum lead corresponde aos filtros.</Alert>
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
