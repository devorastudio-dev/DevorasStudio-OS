import Link from "next/link";
import { Alert, Button, Card, Input, Label, Textarea } from "@devora/ui";
import { notFound } from "next/navigation";
import { hasPermission } from "../../../lib/auth/permissions";
import {
  moveProposalItem,
  removeProposalItem,
  saveProposalItem,
  updateProposal,
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
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">{proposal.proposal_number}</p>
          <h1>{proposal.title}</h1>
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
      ) : null}
      <nav className="editor-tabs" aria-label="Seções da proposta">
        <a href="#resumo">Resumo</a>
        <a href="#itens">Itens</a>
        <a href="#conteudo">Conteúdo</a>
        <Link href={`/proposals/${id}/preview`}>Preview</Link>
      </nav>
      <div className="crm-detail-grid" id="resumo">
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
      <Card id="itens">
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
      <Card id="conteudo">
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
