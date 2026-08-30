import { Alert, Card } from "@devora/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { hasPermission } from "../../../../lib/auth/permissions";
import { createClient } from "../../../../lib/supabase/server";
import { updateCompany } from "../../../../lib/crm/actions";
import { CompanyForm } from "../../_components/forms";
export default async function CompanyDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; error?: string }>;
}) {
  const access = await requireCrmAccess();
  const canWrite = await hasPermission("crm.write", access.organization.id);
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: company }, { data: contacts }, { data: leads }] =
    await Promise.all([
      supabase
        .from("crm_companies")
        .select("*")
        .eq("organization_id", access.organization.id)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("crm_contacts")
        .select("id,full_name,state")
        .eq("organization_id", access.organization.id)
        .eq("company_id", id)
        .limit(20),
      supabase
        .from("leads")
        .select("id,full_name,triage_status")
        .eq("organization_id", access.organization.id)
        .eq("company_id", id)
        .limit(20),
    ]);
  if (!company) notFound();
  const { count: possibleDuplicates } = await supabase
    .from("crm_companies")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", access.organization.id)
    .eq("normalized_name", company.normalized_name)
    .neq("id", company.id);
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Empresa</p>
          <h1>{company.display_name}</h1>
          <p>{company.state === "active" ? "Ativa" : "Arquivada"}</p>
        </div>
      </header>
      {query.saved || query.created ? (
        <Alert variant="success">Empresa salva.</Alert>
      ) : query.error ? (
        <Alert variant="error">Não foi possível salvar.</Alert>
      ) : null}
      {(possibleDuplicates ?? 0) > 0 ? (
        <Alert variant="warning">
          Possível duplicidade pelo nome normalizado.
        </Alert>
      ) : null}
      <div className="crm-detail-grid">
        {canWrite ? (
          <Card>
            <h2>Dados comerciais</h2>
            <CompanyForm action={updateCompany} value={company} />
          </Card>
        ) : (
          <Card>
            <h2>Dados comerciais</h2>
            <p>{company.email ?? "Sem e-mail geral"}</p>
            <p>{company.phone ?? "Sem telefone"}</p>
          </Card>
        )}
        <div className="crm-stack">
          <Card>
            <h2>Contatos vinculados</h2>
            {contacts?.length ? (
              <ul>
                {contacts.map((v) => (
                  <li key={v.id}>
                    <Link href={`/crm/contacts/${v.id}`}>{v.full_name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum contato vinculado.</p>
            )}
          </Card>
          <Card>
            <h2>Leads vinculados</h2>
            {leads?.length ? (
              <ul>
                {leads.map((v) => (
                  <li key={v.id}>
                    <Link href={`/crm/leads/${v.id}`}>{v.full_name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum lead vinculado.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
