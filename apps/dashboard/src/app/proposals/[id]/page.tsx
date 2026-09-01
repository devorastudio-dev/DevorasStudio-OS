<<<<<<< HEAD
import Link from "next/link";
import { Alert, Button, Card, Input, Label, Textarea } from "@devora/ui";
import { notFound } from "next/navigation";
import { hasPermission } from "../../../lib/auth/permissions";
=======
import { Alert, Card, Input, Label, Textarea } from "@devora/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasPermission } from "../../../lib/auth/permissions";
import { requireProposalsAccess } from "../../../lib/proposals/access";
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
import {
  moveProposalItem,
  removeProposalItem,
  saveProposalItem,
  updateProposal,
<<<<<<< HEAD
  saveProposalSection,
  removeProposalSection,
  moveProposalSection,
  updateDocumentSettings,
} from "../../../lib/proposals/actions";
import { requireProposalsAccess } from "../../../lib/proposals/access";
import {
  formatMoney,
  SERVICE_UNITS,
  unitLabels,
} from "../../../lib/proposals/validation";
import { createClient } from "../../../lib/supabase/server";
import { ProposalItemEditor } from "../_components/proposal-item-editor";
import {
  PROPOSAL_SECTION_TYPES,
  sectionTypeLabels,
} from "../../../lib/proposals/document";
=======
} from "../../../lib/proposals/actions";
import { createProposalsDb } from "../../../lib/proposals/db";
import {
  formatMoney,
  isDraft,
  proposalStatusLabels,
  SERVICE_UNITS,
  type ServiceUnit,
  unitLabels,
} from "../../../lib/proposals/domain";
import {
  ConfirmRemovalForm,
  ProposalSubmit,
} from "../_components/form-controls";
type Proposal = {
  id: string;
  proposal_number: string;
  client_id: string;
  opportunity_id: string | null;
  title: string;
  status: keyof typeof proposalStatusLabels;
  valid_until: string | null;
  subtotal: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
};
type Item = {
  id: string;
  service_id: string | null;
  position: number;
  name: string;
  description: string | null;
  quantity: string;
  unit: ServiceUnit;
  unit_price: string;
  line_total: string;
};
type Service = {
  id: string;
  name: string;
  default_unit: ServiceUnit;
  default_price: string;
  description: string | null;
};
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
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
<<<<<<< HEAD
  const { id } = await params;
  const q = await searchParams;
  const s = await createClient();
  const [
    { data: proposal },
    { data: items },
    { data: services },
    { data: sections },
    { data: settings },
  ] = await Promise.all([
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
    s
      .from("proposal_sections")
      .select("*")
      .eq("organization_id", access.organization.id)
      .eq("proposal_id", id)
      .order("position"),
    s
      .from("organization_document_settings")
      .select("*")
      .eq("organization_id", access.organization.id)
      .maybeSingle(),
  ]);
  if (!proposal) notFound();
  const editable = canWrite && proposal.status === "draft";
=======
  const { id } = await params,
    query = await searchParams,
    db = await createProposalsDb();
  const [{ data: proposalData }, { data: itemData }, { data: serviceData }] =
    await Promise.all([
      db
        .from("proposals")
        .select("*")
        .eq("organization_id", access.organization.id)
        .eq("id", id)
        .maybeSingle(),
      db
        .from("proposal_items")
        .select("*")
        .eq("organization_id", access.organization.id)
        .eq("proposal_id", id)
        .order("position"),
      db
        .from("services")
        .select("id,name,description,default_unit,default_price")
        .eq("organization_id", access.organization.id)
        .eq("is_active", true)
        .order("name")
        .limit(100),
    ]);
  if (!proposalData) notFound();
  const proposal = proposalData as Proposal,
    items = (itemData ?? []) as Item[],
    services = (serviceData ?? []) as Service[],
    editable = canWrite && isDraft(proposal.status);
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">{proposal.proposal_number}</p>
          <h1>{proposal.title}</h1>
<<<<<<< HEAD
          <p>Rascunho · Cliente {proposal.client_id.slice(0, 8)}</p>
        </div>
        <div className="crm-inline-links">
          <Link href={`/proposals/${id}/preview`}>Abrir preview</Link>
          <Link href="/proposals">Voltar</Link>
        </div>
      </header>
      {q.created || q.saved ? (
        <Alert variant="success">Proposta salva.</Alert>
      ) : q.error ? (
        <Alert variant="error">Não foi possível concluir a operação.</Alert>
=======
          <p>
            {proposalStatusLabels[proposal.status]} · {proposal.currency}
          </p>
        </div>
        <Link href="/proposals">Voltar às propostas</Link>
      </header>
      {query.created || query.saved ? (
        <Alert variant="success">Proposta salva com sucesso.</Alert>
      ) : query.error ? (
        <Alert variant="error">
          A operação não foi concluída. Revise os dados.
        </Alert>
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
      ) : null}
      <div className="crm-detail-grid">
        <Card>
          <h2>Dados comerciais</h2>
          {editable ? (
            <form action={updateProposal} className="crm-form">
<<<<<<< HEAD
              <input type="hidden" name="id" value={id} />
=======
              <input type="hidden" name="proposalId" value={id} />
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
<<<<<<< HEAD
                  defaultValue={proposal.title}
                  required
=======
                  required
                  defaultValue={proposal.title}
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
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
<<<<<<< HEAD
                <Label htmlFor="discount">Desconto fixo</Label>
=======
                <Label htmlFor="discount">Desconto fixo (BRL)</Label>
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max={proposal.subtotal}
<<<<<<< HEAD
                  step=".01"
                  defaultValue={proposal.discount_amount}
                />
              </div>
              <Button>Salvar dados</Button>
            </form>
          ) : (
            <p>Esta proposta está disponível somente para leitura.</p>
          )}
=======
                  step="0.01"
                  defaultValue={proposal.discount_amount}
                />
              </div>
              <ProposalSubmit>Salvar proposta</ProposalSubmit>
            </form>
          ) : (
            <p>Esta proposta está em modo somente leitura.</p>
          )}
          <dl className="crm-details">
            <dt>Cliente</dt>
            <dd>
              <Link href={`/crm/clients/${proposal.client_id}`}>
                Abrir cliente
              </Link>
            </dd>
            <dt>Oportunidade</dt>
            <dd>
              {proposal.opportunity_id ? (
                <Link href={`/crm/opportunities/${proposal.opportunity_id}`}>
                  Abrir oportunidade
                </Link>
              ) : (
                "Não vinculada"
              )}
            </dd>
          </dl>
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
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
<<<<<<< HEAD
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
=======
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
          </dl>
        </Card>
      </div>
      <Card>
        <h2>Itens</h2>
<<<<<<< HEAD
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
      <Card>
        <h2>Conteúdo do documento</h2>
        <p>
          Texto simples e tokens seguros. Disponíveis:{" "}
          <code>{"{{client.name}}"}</code>, <code>{"{{proposal.number}}"}</code>
          , <code>{"{{proposal.valid_until}}"}</code>,{" "}
          <code>{"{{proposal.total}}"}</code>,{" "}
          <code>{"{{organization.name}}"}</code>.
        </p>
        <div className="crm-card-list">
          {(sections ?? []).map((section) => (
            <div
              className="crm-list-card proposal-section-card"
              key={section.id}
            >
              <div>
                <strong>
                  {section.position}. {section.title}
                </strong>
                <span>
                  {section.is_visible ? "Visível" : "Oculta"} ·{" "}
                  {sectionTypeLabels[section.section_type]}
                </span>
              </div>
              {editable ? (
                <div className="proposal-section-actions">
                  <details>
                    <summary>Editar</summary>
                    <form action={saveProposalSection} className="crm-form">
                      <input type="hidden" name="proposalId" value={id} />
                      <input
                        type="hidden"
                        name="sectionId"
                        value={section.id}
                      />
                      <input
                        type="hidden"
                        name="sectionType"
                        value={section.section_type}
                      />
                      <div className="crm-field">
                        <Label htmlFor={`section-title-${section.id}`}>
                          Título
                        </Label>
                        <Input
                          id={`section-title-${section.id}`}
                          name="title"
                          defaultValue={section.title}
                          maxLength={120}
                          required
                        />
                      </div>
                      <div className="crm-field">
                        <Label htmlFor={`section-content-${section.id}`}>
                          Conteúdo
                        </Label>
                        <Textarea
                          id={`section-content-${section.id}`}
                          name="content"
                          defaultValue={section.content}
                          maxLength={12000}
                        />
                      </div>
                      <label className="crm-check">
                        <input
                          type="checkbox"
                          name="visible"
                          defaultChecked={section.is_visible}
                        />{" "}
                        Exibir no preview
                      </label>
                      <div className="crm-inline-links">
                        <Button type="submit">Salvar</Button>
                        <Button type="reset" variant="secondary">
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </details>
                  <form action={moveProposalSection}>
                    <input type="hidden" name="proposalId" value={id} />
                    <input type="hidden" name="sectionId" value={section.id} />
                    <button type="submit" name="direction" value="-1">
                      Mover para cima
                    </button>
                    <button type="submit" name="direction" value="1">
                      Mover para baixo
                    </button>
                  </form>
                  <form action={removeProposalSection}>
                    <input type="hidden" name="proposalId" value={id} />
                    <input type="hidden" name="sectionId" value={section.id} />
                    <Button type="submit" variant="secondary">
                      Remover
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {editable ? (
          <details className="proposal-new-section">
            <summary>Adicionar seção personalizada</summary>
            <form action={saveProposalSection} className="crm-form">
              <input type="hidden" name="proposalId" value={id} />
              <input type="hidden" name="sectionId" value="" />
              <div className="crm-field">
                <Label htmlFor="newSectionType">Tipo</Label>
                <select
                  id="newSectionType"
                  name="sectionType"
                  defaultValue="custom"
                >
                  {PROPOSAL_SECTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {sectionTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <Label htmlFor="newSectionTitle">Título</Label>
                <Input
                  id="newSectionTitle"
                  name="title"
                  maxLength={120}
                  required
                />
              </div>
              <div className="crm-field">
                <Label htmlFor="newSectionContent">Conteúdo</Label>
                <Textarea
                  id="newSectionContent"
                  name="content"
                  maxLength={12000}
                />
              </div>
              <label className="crm-check">
                <input type="checkbox" name="visible" defaultChecked /> Exibir
                no preview
              </label>
              <Button type="submit">Criar seção</Button>
            </form>
          </details>
        ) : null}
      </Card>
      {editable ? (
        <Card>
          <h2>Dados institucionais do documento</h2>
          <form action={updateDocumentSettings} className="crm-form">
            <input type="hidden" name="proposalId" value={id} />
            <div className="crm-field">
              <Label htmlFor="displayName">Nome comercial</Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={
                  settings?.display_name ?? access.organization.name
                }
                required
              />
            </div>
            <div className="crm-field">
              <Label htmlFor="documentEmail">E-mail</Label>
              <Input
                id="documentEmail"
                name="email"
                type="email"
                defaultValue={settings?.email ?? ""}
              />
            </div>
            <div className="crm-field">
              <Label htmlFor="documentPhone">Telefone</Label>
              <Input
                id="documentPhone"
                name="phone"
                defaultValue={settings?.phone ?? ""}
              />
            </div>
            <div className="crm-field">
              <Label htmlFor="documentWebsite">Site</Label>
              <Input
                id="documentWebsite"
                name="website"
                type="url"
                defaultValue={settings?.website ?? ""}
              />
            </div>
            <div className="crm-field">
              <Label htmlFor="documentCity">Cidade</Label>
              <Input
                id="documentCity"
                name="city"
                defaultValue={settings?.city ?? ""}
              />
            </div>
            <Button type="submit">Salvar dados institucionais</Button>
          </form>
        </Card>
      ) : null}
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
=======
        {items.length ? (
          <ol className="proposal-items">
            {items.map((item, index) => (
              <li key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.quantity} {unitLabels[item.unit]} ×{" "}
                    {formatMoney(item.unit_price)} ={" "}
                    {formatMoney(item.line_total)}
                  </p>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
                {editable ? (
                  <div className="proposal-item-actions">
                    <details>
                      <summary>Editar</summary>
                      <ItemForm proposalId={id} item={item} />
                    </details>
                    <form action={moveProposalItem}>
                      <input type="hidden" name="proposalId" value={id} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        name="direction"
                        value="up"
                        disabled={index === 0}
                        aria-label={`Mover ${item.name} para cima`}
                      >
                        ↑
                      </button>
                      <button
                        name="direction"
                        value="down"
                        disabled={index === items.length - 1}
                        aria-label={`Mover ${item.name} para baixo`}
                      >
                        ↓
                      </button>
                    </form>
                    <ConfirmRemovalForm action={removeProposalItem}>
                      <input type="hidden" name="proposalId" value={id} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <ProposalSubmit>Remover</ProposalSubmit>
                    </ConfirmRemovalForm>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p>Nenhum item adicionado ainda.</p>
        )}
      </Card>
      {editable ? (
        <div className="crm-detail-grid">
          <Card>
            <h2>Adicionar do catálogo</h2>
            <form action={saveProposalItem} className="crm-form">
              <input type="hidden" name="proposalId" value={id} />
              <input type="hidden" name="itemId" value="" />
              <input type="hidden" name="name" value="Serviço do catálogo" />
              <input type="hidden" name="description" value="" />
              <input type="hidden" name="unit" value="project" />
              <input type="hidden" name="unitPrice" value="0" />
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
              <div>
                <Label htmlFor="serviceId">Serviço</Label>
                <select id="serviceId" name="serviceId" required>
                  <option value="">Selecione</option>
<<<<<<< HEAD
                  {services?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {formatMoney(v.default_price)}
=======
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {formatMoney(s.default_price)}
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
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
<<<<<<< HEAD
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
=======
                  min="0.001"
                  step="0.001"
                  defaultValue="1"
                  required
                />
              </div>
              <ProposalSubmit>Adicionar serviço</ProposalSubmit>
            </form>
          </Card>
          <Card>
            <h2>Adicionar item personalizado</h2>
            <ItemForm proposalId={id} />
          </Card>
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
        </div>
      ) : null}
    </>
  );
}
<<<<<<< HEAD
=======
function ItemForm({ proposalId, item }: { proposalId: string; item?: Item }) {
  return (
    <form action={saveProposalItem} className="crm-form">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="itemId" value={item?.id ?? ""} />
      <input type="hidden" name="serviceId" value={item?.service_id ?? ""} />
      <div>
        <Label htmlFor={`item-name-${item?.id ?? "new"}`}>Nome</Label>
        <Input
          id={`item-name-${item?.id ?? "new"}`}
          name="name"
          required
          minLength={2}
          maxLength={160}
          defaultValue={item?.name}
        />
      </div>
      <div>
        <Label htmlFor={`item-description-${item?.id ?? "new"}`}>
          Descrição
        </Label>
        <Textarea
          id={`item-description-${item?.id ?? "new"}`}
          name="description"
          maxLength={2000}
          defaultValue={item?.description ?? ""}
        />
      </div>
      <div>
        <Label htmlFor={`quantity-${item?.id ?? "new"}`}>Quantidade</Label>
        <Input
          id={`quantity-${item?.id ?? "new"}`}
          name="quantity"
          type="number"
          min="0.001"
          step="0.001"
          required
          defaultValue={item?.quantity ?? "1"}
        />
      </div>
      <div>
        <Label htmlFor={`unit-${item?.id ?? "new"}`}>Unidade</Label>
        <select
          id={`unit-${item?.id ?? "new"}`}
          name="unit"
          defaultValue={item?.unit ?? "project"}
        >
          {SERVICE_UNITS.map((v) => (
            <option key={v} value={v}>
              {unitLabels[v]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`price-${item?.id ?? "new"}`}>
          Preço unitário (BRL)
        </Label>
        <Input
          id={`price-${item?.id ?? "new"}`}
          name="unitPrice"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={item?.unit_price ?? "0.00"}
        />
      </div>
      <ProposalSubmit>{item ? "Salvar item" : "Adicionar item"}</ProposalSubmit>
    </form>
  );
}
>>>>>>> 5e27d76 (ajustes para correção de versões descincronizadas)
