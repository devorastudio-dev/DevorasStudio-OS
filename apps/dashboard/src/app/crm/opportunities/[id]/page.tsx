import { Alert, Card, Input, Label } from "@devora/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasPermission } from "../../../../lib/auth/permissions";
import { requireCrmAccess } from "../../../../lib/crm/access";
import {
  moveOpportunity,
  updateOpportunity,
} from "../../../../lib/crm/pipeline-actions";
import {
  formatEstimatedValue,
  lossReasonLabels,
  LOSS_REASONS,
} from "../../../../lib/crm/pipeline";
import { createClient } from "../../../../lib/supabase/server";
import { PipelineSubmit } from "../../_components/pipeline-submit";
import { ActivityTaskPanel } from "../../_components/activity-task-panel";

export default async function OpportunityDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    moved?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const access = await requireCrmAccess();
  const canWrite = await hasPermission("crm.write", access.organization.id);
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: opportunity }, { data: stages }, { data: members }] =
    await Promise.all([
      supabase
        .from("opportunities")
        .select("*")
        .eq("organization_id", access.organization.id)
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("pipeline_stages")
        .select("id,name,category,position")
        .eq("organization_id", access.organization.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("organization_members")
        .select("id,user_id")
        .eq("organization_id", access.organization.id)
        .eq("status", "active"),
    ]);
  if (!opportunity) notFound();
  const { data: history } = await supabase
    .from("opportunity_stage_history")
    .select("id,previous_stage_id,new_stage_id,changed_by,context,created_at")
    .eq("organization_id", access.organization.id)
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });
  const [{ data: activities }, { data: tasks }] = await Promise.all([
    supabase
      .from("crm_activities")
      .select("id,activity_type,title,description,occurred_at")
      .eq("organization_id", access.organization.id)
      .eq("opportunity_id", id)
      .order("occurred_at", { ascending: false })
      .limit(20),
    supabase
      .from("crm_tasks")
      .select("id,title,due_at,status,version")
      .eq("organization_id", access.organization.id)
      .eq("opportunity_id", id)
      .order("due_at")
      .limit(20),
  ]);
  const stageMap = new Map(
    (stages ?? []).map((stage) => [stage.id, stage.name]),
  );
  const query = await searchParams;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Oportunidade</p>
          <h1>{opportunity.title}</h1>
          <p>
            {stageMap.get(opportunity.stage_id)} ·{" "}
            {formatEstimatedValue(opportunity.estimated_value)}
          </p>
        </div>
        <Link href="/crm/pipeline">Voltar ao pipeline</Link>
      </header>
      {query.created || query.moved || query.saved ? (
        <Alert variant="success">Oportunidade atualizada com sucesso.</Alert>
      ) : query.error ? (
        <Alert variant="error">
          A operação não foi concluída. Recarregue e tente novamente.
        </Alert>
      ) : null}
      <div className="crm-detail-grid">
        <Card>
          <h2>Resumo</h2>
          <dl className="crm-details">
            <dt>Aberta em</dt>
            <dd>{new Date(opportunity.opened_at).toLocaleString("pt-BR")}</dd>
            <dt>Fechamento</dt>
            <dd>
              {opportunity.closed_at
                ? new Date(opportunity.closed_at).toLocaleString("pt-BR")
                : "Em aberto"}
            </dd>
            <dt>Motivo de perda</dt>
            <dd>
              {opportunity.loss_reason
                ? lossReasonLabels[opportunity.loss_reason]
                : "Não aplicável"}
            </dd>
            <dt>Lead de origem</dt>
            <dd>
              {opportunity.lead_id ? (
                <Link href={`/crm/leads/${opportunity.lead_id}`}>
                  Abrir lead
                </Link>
              ) : (
                "Sem lead"
              )}
            </dd>
          </dl>
        </Card>
        {canWrite ? (
          <Card>
            <h2>Dados comerciais</h2>
            <form action={updateOpportunity} className="crm-form">
              <input
                type="hidden"
                name="opportunityId"
                value={opportunity.id}
              />
              <input type="hidden" name="version" value={opportunity.version} />
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={opportunity.title}
                  required
                  minLength={2}
                  maxLength={160}
                />
              </div>
              <div>
                <Label htmlFor="estimatedValue">Valor estimado (BRL)</Label>
                <Input
                  id="estimatedValue"
                  name="estimatedValue"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={opportunity.estimated_value ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="assignedMembershipId">Responsável</Label>
                <select
                  id="assignedMembershipId"
                  name="assignedMembershipId"
                  defaultValue={opportunity.assigned_membership_id ?? ""}
                >
                  <option value="">Sem responsável</option>
                  {(members ?? []).map((member) => (
                    <option key={member.id} value={member.id}>
                      Membro {member.user_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <label>
                <input
                  type="checkbox"
                  name="archived"
                  defaultChecked={Boolean(opportunity.archived_at)}
                />{" "}
                Arquivada
              </label>
              <PipelineSubmit>Salvar dados</PipelineSubmit>
            </form>
          </Card>
        ) : null}
        {canWrite ? (
          <Card>
            <h2>Mover etapa</h2>
            <form action={moveOpportunity} className="crm-form">
              <input
                type="hidden"
                name="opportunityId"
                value={opportunity.id}
              />
              <input type="hidden" name="version" value={opportunity.version} />
              <div>
                <Label htmlFor="stageId">Etapa de destino</Label>
                <select
                  id="stageId"
                  name="stageId"
                  defaultValue={opportunity.stage_id}
                >
                  {(stages ?? []).map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="lossReason">Motivo de perda</Label>
                <select id="lossReason" name="lossReason" defaultValue="">
                  <option value="">Não aplicável</option>
                  {LOSS_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {lossReasonLabels[reason]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="lossDetail">Complemento para “Outro”</Label>
                <Input id="lossDetail" name="lossDetail" maxLength={240} />
              </div>
              <PipelineSubmit>Mover oportunidade</PipelineSubmit>
            </form>
          </Card>
        ) : (
          <Alert variant="warning">Seu acesso permite somente consulta.</Alert>
        )}
      </div>
      <Card>
        <h2>Histórico de etapas</h2>
        {history?.length ? (
          <ol className="pipeline-history">
            {history.map((entry) => (
              <li key={entry.id}>
                <strong>
                  {entry.previous_stage_id
                    ? stageMap.get(entry.previous_stage_id)
                    : "Criação"}{" "}
                  → {stageMap.get(entry.new_stage_id)}
                </strong>
                <span>
                  {new Date(entry.created_at).toLocaleString("pt-BR")} ·{" "}
                  {entry.context === "reopened"
                    ? "Reabertura"
                    : entry.context === "created"
                      ? "Criação"
                      : "Movimentação"}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p>Nenhuma movimentação registrada.</p>
        )}
      </Card>
      <ActivityTaskPanel
        canWrite={canWrite}
        returnTo={`/crm/opportunities/${id}`}
        members={(members ?? []).map((member) => ({
          id: member.id,
          label: `Membro ${member.user_id.slice(0, 8)}`,
        }))}
        link={{
          opportunityId: id,
          leadId: opportunity.lead_id,
          companyId: opportunity.company_id,
          contactId: opportunity.contact_id,
        }}
        activities={activities ?? []}
        tasks={tasks ?? []}
      />
    </>
  );
}
