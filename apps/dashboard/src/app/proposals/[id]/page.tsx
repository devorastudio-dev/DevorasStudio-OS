import Link from "next/link";
import { Alert, Button, Card, Input, Label, Textarea } from "@devora/ui";
import { notFound } from "next/navigation";
import { hasPermission } from "../../../lib/auth/permissions";
import {
  moveProposalItem,
  removeProposalItem,
  saveProposalItem,
  updateProposal,
} from "../../../lib/proposals/actions";
import { requireProposalsAccess } from "../../../lib/proposals/access";
import {
  formatMoney,
  SERVICE_UNITS,
  unitLabels,
} from "../../../lib/proposals/validation";
import { createClient } from "../../../lib/supabase/server";
import { ProposalItemEditor } from "../_components/proposal-item-editor";
export default async function ProposalDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const access = await requireProposalsAccess();
  const canWrite = await hasPermission(
    "proposals.write",
    access.organization.id,
  );
  const { id } = await params;
  const q = await searchParams;
  const s = await createClient();
  const [{ data: proposal }, { data: items }, { data: services }] =
    await Promise.all([
      s
        .from("proposals")
        .select("*")
        .eq("organization_id", access.organization.id)
        .eq("id", id)
        .maybeSingle(),
      s
        .from("proposal_items")
        .select("*")
        .eq("organization_id", access.organization.id)
        .eq("proposal_id", id)
        .order("position"),
      s
        .from("services")
        .select("id,name,default_unit,default_price")
        .eq("organization_id", access.organization.id)
        .eq("is_active", true)
        .order("name")
        .limit(100),
    ]);
  if (!proposal) notFound();
  const editable = canWrite && proposal.status === "draft";
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">{proposal.proposal_number}</p>
          <h1>{proposal.title}</h1>
          <p>Rascunho · Cliente {proposal.client_id.slice(0, 8)}</p>
        </div>
        <Link href="/proposals">Voltar</Link>
      </header>
      {q.created || q.saved ? (
        <Alert variant="success">Proposta salva.</Alert>
      ) : q.error ? (
        <Alert variant="error">Não foi possível concluir a operação.</Alert>
      ) : null}
      <div className="crm-detail-grid">
        <Card>
          <h2>Dados comerciais</h2>
          {editable ? (
            <form action={updateProposal} className="crm-form">
              <input type="hidden" name="id" value={id} />
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={proposal.title}
                  required
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Validade</Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                  defaultValue={proposal.valid_until ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="discount">Desconto fixo</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max={proposal.subtotal}
                  step=".01"
                  defaultValue={proposal.discount_amount}
                />
              </div>
              <Button>Salvar dados</Button>
            </form>
          ) : (
            <p>Esta proposta está disponível somente para leitura.</p>
          )}
        </Card>
        <Card>
          <h2>Totais</h2>
          <dl className="crm-details">
            <dt>Subtotal</dt>
            <dd>{formatMoney(proposal.subtotal)}</dd>
            <dt>Desconto</dt>
            <dd>{formatMoney(proposal.discount_amount)}</dd>
            <dt>Total</dt>
            <dd>
              <strong>{formatMoney(proposal.total_amount)}</strong>
            </dd>
            <dt>Moeda</dt>
            <dd>BRL</dd>
            <dt>Validade</dt>
            <dd>
              {proposal.valid_until
                ? new Date(
                    proposal.valid_until + "T12:00:00",
                  ).toLocaleDateString("pt-BR")
                : "Não definida"}
            </dd>
          </dl>
        </Card>
      </div>
      <Card>
        <h2>Itens</h2>
        {items?.length ? (
          <div className="crm-card-list">
            {items.map((v) => (
              <div className="crm-list-card" key={v.id}>
                <div>
                  <strong>
                    {v.position}. {v.name}
                  </strong>
                  <span>
                    {v.quantity} {unitLabels[v.unit]} ×{" "}
                    {formatMoney(v.unit_price)} ={" "}
                    {formatMoney(v.line_total ?? 0)}
                  </span>
                </div>
                {editable ? (
                  <div className="crm-inline-links">
                    <ProposalItemEditor
                      proposalId={id}
                      item={v}
                      canEdit={editable}
                      hasError={
                        q.error === "item-validation" || q.error === "item"
                      }
                    />
                    <form action={moveProposalItem}>
                      <input type="hidden" name="proposalId" value={id} />
                      <input type="hidden" name="itemId" value={v.id} />
                      <button name="direction" value="-1" type="submit">
                        Subir
                      </button>
                      <button name="direction" value="1" type="submit">
                        Descer
                      </button>
                    </form>
                    <form action={removeProposalItem}>
                      <input type="hidden" name="proposalId" value={id} />
                      <input type="hidden" name="itemId" value={v.id} />
                      <Button variant="secondary">Remover</Button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="warning">Nenhum item adicionado.</Alert>
        )}
      </Card>
      {editable ? (
        <div className="crm-detail-grid">
          <Card>
            <h2>Adicionar pelo catálogo</h2>
            <form action={saveProposalItem} className="crm-form">
              <input type="hidden" name="proposalId" value={id} />
              <input type="hidden" name="itemId" value="" />
              <input type="hidden" name="name" value="" />
              <input type="hidden" name="description" value="" />
              <input type="hidden" name="unit" value="" />
              <input type="hidden" name="unitPrice" value="" />
              <div>
                <Label htmlFor="serviceId">Serviço</Label>
                <select id="serviceId" name="serviceId" required>
                  <option value="">Selecione</option>
                  {services?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {formatMoney(v.default_price)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="catalogQuantity">Quantidade</Label>
                <Input
                  id="catalogQuantity"
                  name="quantity"
                  type="number"
                  min=".001"
                  step=".001"
                  defaultValue="1"
                />
              </div>
              <Button>Adicionar serviço</Button>
            </form>
          </Card>
          <Card>
            <h2>Item personalizado</h2>
            <form action={saveProposalItem} className="crm-form">
              <input type="hidden" name="proposalId" value={id} />
              <input type="hidden" name="itemId" value="" />
              <input type="hidden" name="serviceId" value="" />
              <div>
                <Label htmlFor="itemName">Nome</Label>
                <Input id="itemName" name="name" required />
              </div>
              <div>
                <Label htmlFor="itemDescription">Descrição</Label>
                <Textarea id="itemDescription" name="description" />
              </div>
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min=".001"
                  step=".001"
                  defaultValue="1"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <select id="unit" name="unit">
                  {SERVICE_UNITS.map((v) => (
                    <option key={v} value={v}>
                      {unitLabels[v]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="unitPrice">Preço unitário</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step=".01"
                  required
                />
              </div>
              <Button>Adicionar item</Button>
            </form>
          </Card>
        </div>
      ) : null}
    </>
  );
}
