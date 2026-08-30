import { Alert, Card } from "@devora/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { hasPermission } from "../../../../lib/auth/permissions";
import { createClient } from "../../../../lib/supabase/server";
import { updateContact } from "../../../../lib/crm/actions";
import { ContactForm } from "../../_components/forms";
export default async function ContactDetail({
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
  const [{ data: contact }, { data: companies }, { data: leads }] =
    await Promise.all([
      supabase
        .from("crm_contacts")
        .select("*")
        .eq("organization_id", access.organization.id)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("crm_companies")
        .select("id,display_name")
        .eq("organization_id", access.organization.id)
        .eq("state", "active"),
      supabase
        .from("leads")
        .select("id,full_name,triage_status")
        .eq("organization_id", access.organization.id)
        .eq("contact_id", id)
        .limit(20),
    ]);
  if (!contact) notFound();
  const possibleDuplicates = contact.email
    ? ((
        await supabase
          .from("crm_contacts")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", access.organization.id)
          .eq("email", contact.email)
          .neq("id", contact.id)
      ).count ?? 0)
    : 0;
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Contato</p>
          <h1>{contact.full_name}</h1>
          <p>{contact.state === "active" ? "Ativo" : "Arquivado"}</p>
        </div>
      </header>
      {query.saved || query.created ? (
        <Alert variant="success">Contato salvo.</Alert>
      ) : query.error ? (
        <Alert variant="error">Não foi possível salvar.</Alert>
      ) : null}
      {possibleDuplicates > 0 ? (
        <Alert variant="warning">Possível duplicidade pelo e-mail.</Alert>
      ) : null}
      <div className="crm-detail-grid">
        {canWrite ? (
          <Card>
            <h2>Dados do contato</h2>
            <ContactForm
              action={updateContact}
              value={contact}
              companies={(companies ?? []).map((v) => ({
                id: v.id,
                label: v.display_name,
              }))}
            />
          </Card>
        ) : (
          <Card>
            <h2>Dados do contato</h2>
            <p>{contact.email ?? "Sem e-mail"}</p>
            <p>{contact.phone ?? "Sem telefone"}</p>
          </Card>
        )}
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
    </>
  );
}
