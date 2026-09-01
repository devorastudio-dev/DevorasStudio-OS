import { Alert, Card } from "@devora/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCrmAccess } from "../../../../lib/crm/access";
import { hasPermission } from "../../../../lib/auth/permissions";
import { createClient } from "../../../../lib/supabase/server";
import { updateLead } from "../../../../lib/crm/actions";
import { LeadUpdateForm } from "../../_components/forms";
import { sourceLabels } from "../../../../lib/crm/constants";
import { createOpportunityFromLead } from "../../../../lib/crm/pipeline-actions";
import { PipelineSubmit } from "../../_components/pipeline-submit";
import { ActivityTaskPanel } from "../../_components/activity-task-panel";
import {
  leadEmailHref,
  leadEmailText,
} from "../../../../lib/crm/lead-presentation";
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
  const { count: possibleDuplicates } = lead.email
    ? await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", access.organization.id)
        .eq("email", lead.email)
        .neq("id", lead.id)
    : { count: 0 };
  const { data: existingOpportunity } = await supabase
    .from("opportunities")
    .select("id")
    .eq("organization_id", access.organization.id)
    .eq("lead_id", lead.id)
    .maybeSingle();
  const [{ data: activities }, { data: tasks }] = await Promise.all([
    supabase
      .from("crm_activities")
      .select("id,activity_type,title,description,occurred_at")
      .eq("organization_id", access.organization.id)
      .eq("lead_id", lead.id)
      .order("occurred_at", { ascending: false })
      .limit(20),
    supabase
      .from("crm_tasks")
      .select("id,title,due_at,status,version")
      .eq("organization_id", access.organization.id)
      .eq("lead_id", lead.id)
      .order("due_at")
      .limit(20),
  ]);
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
            <dd>
              {leadEmailHref(lead.email) ? (
                <a href={leadEmailHref(lead.email) ?? undefined}>
                  {leadEmailText(lead.email)}
                </a>
              ) : (
                leadEmailText(lead.email)
              )}
            </dd>
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
            <h2>Editar lead</h2>
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
      {canWrite ? (
        <Card>
          <h2>Oportunidade comercial</h2>
          {existingOpportunity ? (
            <Link href={`/crm/opportunities/${existingOpportunity.id}`}>
              Abrir oportunidade deste lead
            </Link>
          ) : (
            <form action={createOpportunityFromLead} className="crm-form">
              <input type="hidden" name="leadId" value={lead.id} />
              <div>
                <label htmlFor="opportunity-title">Título</label>
                <input
                  id="opportunity-title"
                  name="title"
                  defaultValue={`Oportunidade - ${lead.full_name}`}
                  minLength={2}
                  maxLength={160}
                  required
                />
              </div>
              <div>
                <label htmlFor="opportunity-value">Valor estimado (BRL)</label>
                <input
                  id="opportunity-value"
                  name="estimatedValue"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              <PipelineSubmit>Criar oportunidade</PipelineSubmit>
            </form>
          )}
        </Card>
      ) : null}
      <ActivityTaskPanel
        canWrite={canWrite}
        returnTo={`/crm/leads/${lead.id}`}
        members={(members ?? []).map((member) => ({
          id: member.id,
          label: `Membro ${member.user_id.slice(0, 8)}`,
        }))}
        link={{
          leadId: lead.id,
          companyId: lead.company_id,
          contactId: lead.contact_id,
        }}
        activities={activities ?? []}
        tasks={tasks ?? []}
      />
    </>
  );
}
