import Link from "next/link";
import { Alert, Badge, Button, Input, Label } from "@devora/ui";
import { requireProposalsAccess } from "../../lib/proposals/access";
import {
  formatMoney,
  proposalFiltersSchema,
} from "../../lib/proposals/validation";
import { createClient } from "../../lib/supabase/server";
import { Pagination } from "../crm/_components/pagination";
export const dynamic = "force-dynamic";
const pageSize = 20;
export default async function Proposals({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireProposalsAccess();
  const raw = await searchParams;
  const parsed = proposalFiltersSchema.safeParse(raw);
  const filters = parsed.success
    ? parsed.data
    : proposalFiltersSchema.parse({});
  const start = (filters.page - 1) * pageSize;
  const s = await createClient();
  let query = s
    .from("proposals")
    .select(
      "id,proposal_number,client_id,opportunity_id,title,status,total_amount,valid_until,created_at,updated_at",
      { count: "exact" },
    )
    .eq("organization_id", access.organization.id)
    .order("created_at", { ascending: false })
    .range(start, start + pageSize - 1);
  if (filters.q)
    query = query.or(
      `proposal_number.ilike.%${filters.q}%,title.ilike.%${filters.q}%`,
    );
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error, count } = await query;
  const params = new URLSearchParams();
  Object.entries(raw).forEach(([k, v]) => {
    if (typeof v === "string") params.set(k, v);
  });
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Comercial</p>
          <h1>Propostas</h1>
          <p>Rascunhos estruturados vinculados aos clientes.</p>
        </div>
        <div className="crm-inline-links">
          <Link href="/proposals/templates">Modelos</Link>
          <Link href="/proposals/new">Nova proposta</Link>
        </div>
      </header>
      <form className="crm-filters">
        <div>
          <Label htmlFor="q">Buscar</Label>
          <Input
            id="q"
            name="q"
            defaultValue={filters.q}
            placeholder="Número ou título"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status">
            <option value="">Todos</option>
            <option value="draft">Rascunho</option>
          </select>
        </div>
        <Button>Filtrar</Button>
      </form>
      {error ? (
        <Alert variant="error">Não foi possível carregar as propostas.</Alert>
      ) : data?.length ? (
        <div className="crm-card-list">
          {data.map((v) => (
            <Link
              className="crm-list-card"
              href={`/proposals/${v.id}`}
              key={v.id}
            >
              <div>
                <strong>
                  {v.proposal_number} · {v.title}
                </strong>
                <span>
                  {formatMoney(v.total_amount)} · atualizada em{" "}
                  {new Date(v.updated_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <Badge variant="neutral">Rascunho</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <Alert variant="warning">Nenhuma proposta criada ainda.</Alert>
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
