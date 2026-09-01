import { Alert, Button, Card, Input, Label } from "@devora/ui";
import { createProposal } from "../../../lib/proposals/actions";
import { requireProposalsAccess } from "../../../lib/proposals/access";
import { createClient } from "../../../lib/supabase/server";
import { resolveProposalPrefill } from "../../../lib/proposals/prefill";
import { createProposalsDb } from "../../../lib/proposals/db";
export default async function NewProposal({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    opportunity?: string;
    error?: string;
  }>;
}) {
  const access = await requireProposalsAccess("proposals.write");
  const q = await searchParams;
  const s = await createClient();
  const db = await createProposalsDb();
  const [{ data: clients }, { data: rawTemplates }, { data: links }] =
    await Promise.all([
      s
        .from("clients")
        .select("id,company_id,primary_contact_id,source_lead_id")
        .eq("organization_id", access.organization.id)
        .eq("state", "active")
        .order("converted_at", { ascending: false })
        .limit(100),
      db
        .from("proposal_templates")
        .select("id,name")
        .eq("organization_id", access.organization.id)
        .eq("is_active", true)
        .order("name"),
      s
        .from("client_opportunities")
        .select("client_id,opportunity_id")
        .eq("organization_id", access.organization.id)
        .limit(100),
    ]);
  const templates = (rawTemplates ?? []) as Array<{ id: string; name: string }>;
  const prefill = resolveProposalPrefill(q, clients ?? [], links ?? []);
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Propostas</p>
          <h1>Nova proposta</h1>
          <p>Crie o rascunho; itens e totais serão definidos no detalhe.</p>
        </div>
      </header>
      {q.error ? (
        <Alert variant="error">
          Não foi possível criar a proposta. Revise os dados.
        </Alert>
      ) : null}
      <Card>
        <form action={createProposal} className="crm-form">
          <div>
            <Label htmlFor="templateId">Modelo</Label>
            <select id="templateId" name="templateId">
              <option value="">Em branco</option>
              {(templates ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="clientId">Cliente</Label>
            <select
              id="clientId"
              name="clientId"
              defaultValue={prefill.clientId}
              required
            >
              <option value="">Selecione</option>
              {(clients ?? []).map((v) => (
                <option value={v.id} key={v.id}>
                  Cliente {v.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="opportunityId">Oportunidade vinculada</Label>
            <select
              id="opportunityId"
              name="opportunityId"
              defaultValue={prefill.opportunityId}
            >
              <option value="">Sem oportunidade</option>
              {(links ?? [])
                .filter(
                  (v) => !prefill.clientId || v.client_id === prefill.clientId,
                )
                .map((v) => (
                  <option key={v.opportunity_id} value={v.opportunity_id}>
                    Oportunidade {v.opportunity_id.slice(0, 8)}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              required
              minLength={2}
              maxLength={160}
            />
          </div>
          <div>
            <Label htmlFor="validUntil">Validade</Label>
            <Input id="validUntil" name="validUntil" type="date" />
          </div>
          <Button>Criar proposta</Button>
        </form>
      </Card>
    </>
  );
}
