import { Alert, Card } from "@devora/ui";
import { notFound } from "next/navigation";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { hasPermission } from "../../../../lib/auth/permissions";
import { createClient } from "../../../../lib/supabase/server";
import { updateLead } from "../../../../lib/crm/actions";
import { LeadUpdateForm } from "../../_components/forms";
import { sourceLabels } from "../../../../lib/crm/constants";
export default async function LeadDetail({
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
  const [
    { data: lead },
    { data: members },
    { data: companies },
    { data: contacts },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", access.organization.id)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("organization_members")
      .select("id,user_id")
      .eq("organization_id", access.organization.id)
      .eq("status", "active"),
    supabase
      .from("crm_companies")
      .select("id,display_name")
      .eq("organization_id", access.organization.id)
      .eq("state", "active"),
    supabase
      .from("crm_contacts")
      .select("id,full_name")
      .eq("organization_id", access.organization.id)
      .eq("state", "active"),
  ]);
  if (!lead) notFound();
  const { count: possibleDuplicates } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", access.organization.id)
    .eq("email", lead.email)
    .neq("id", lead.id);
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Lead</p>
          <h1>{lead.full_name}</h1>
          <p>
            {sourceLabels[lead.source as keyof typeof sourceLabels] ??
              lead.source}{" "}
            · {new Date(lead.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      </header>
      {query.saved || query.created ? (
        <Alert variant="success">Lead salvo com sucesso.</Alert>
      ) : query.error ? (
        <Alert variant="error">
          A alteração não foi salva. Recarregue e tente novamente.
        </Alert>
      ) : null}
      {(possibleDuplicates ?? 0) > 0 ? (
        <Alert variant="warning">
          Possível duplicidade: existe outro lead com o mesmo e-mail.
        </Alert>
      ) : null}
      <div className="crm-detail-grid">
        <Card>
          <h2>Contato e contexto</h2>
          <dl className="crm-details">
            <dt>E-mail</dt>
            <dd>{lead.email}</dd>
            <dt>Telefone</dt>
            <dd>{lead.phone ?? "Não informado"}</dd>
            <dt>Empresa informada</dt>
            <dd>{lead.company ?? "Não informada"}</dd>
            <dt>Mensagem</dt>
            <dd>{lead.message}</dd>
            <dt>UTMs</dt>
            <dd>
              {[lead.utm_source, lead.utm_medium, lead.utm_campaign]
                .filter(Boolean)
                .join(" / ") || "Não informadas"}
            </dd>
          </dl>
        </Card>
        {canWrite ? (
          <Card>
            <h2>Triagem e vínculos</h2>
            <LeadUpdateForm
              action={updateLead}
              lead={lead}
              members={(members ?? []).map((v) => ({
                id: v.id,
                label: `Membro ${v.user_id.slice(0, 8)}`,
              }))}
              companies={(companies ?? []).map((v) => ({
                id: v.id,
                label: v.display_name,
              }))}
              contacts={(contacts ?? []).map((v) => ({
                id: v.id,
                label: v.full_name,
              }))}
            />
          </Card>
        ) : (
          <Alert variant="warning">Seu acesso permite somente consulta.</Alert>
        )}
      </div>
    </>
  );
}
