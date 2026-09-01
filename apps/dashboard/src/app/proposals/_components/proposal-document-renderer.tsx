import type { ProposalDocument } from "../../../lib/proposals/document";
import { resolveProposalTokens } from "../../../lib/proposals/document";
import { formatMoney, unitLabels } from "../../../lib/proposals/validation";

export function ProposalDocumentRenderer({
  document,
}: Readonly<{ document: ProposalDocument }>) {
  const visible = document.sections.filter(
    (section) => section.visible && section.content.trim(),
  );
  return (
    <article className="proposal-document">
      <header className="proposal-document-header">
        <div>
          <strong>{document.organization.name}</strong>
          <span>
            {[document.organization.city, document.organization.website]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <div>
          <span>PROPOSTA</span>
          <strong>{document.proposal.number}</strong>
        </div>
      </header>
      <section className="proposal-document-meta">
        <div>
          <span>Cliente</span>
          <strong>{document.client.name}</strong>
        </div>
        <div>
          <span>Data</span>
          <strong>
            {new Date(document.proposal.createdAt).toLocaleDateString("pt-BR")}
          </strong>
        </div>
        {document.proposal.validUntil ? (
          <div>
            <span>Validade</span>
            <strong>
              {new Date(
                `${document.proposal.validUntil}T12:00:00`,
              ).toLocaleDateString("pt-BR")}
            </strong>
          </div>
        ) : null}
      </section>
      <h1>{document.proposal.title}</h1>
      {visible.map((section) => {
        const resolved = resolveProposalTokens(section.content, document);
        return (
          <section key={section.id} className="proposal-document-section">
            <h2>{section.title}</h2>
            {resolved.value
              .split(/\r?\n/)
              .filter(Boolean)
              .map((line, index) => (
                <p key={`${section.id}-${index}`}>
                  {line.replace(/^[-*]\s+/, "")}
                </p>
              ))}
          </section>
        );
      })}
      <section className="proposal-investment">
        <h2>Investimento</h2>
        {document.items.length ? (
          <div className="crm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qtd.</th>
                  <th>Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {document.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description ? (
                        <small>{item.description}</small>
                      ) : null}
                    </td>
                    <td>
                      {item.quantity}{" "}
                      {unitLabels[item.unit as keyof typeof unitLabels] ??
                        item.unit}
                    </td>
                    <td>{formatMoney(item.unitPrice)}</td>
                    <td>{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Nenhum item comercial adicionado.</p>
        )}
        <dl className="proposal-totals">
          <dt>Subtotal</dt>
          <dd>{formatMoney(document.proposal.subtotal)}</dd>
          <dt>Desconto</dt>
          <dd>{formatMoney(document.proposal.discount)}</dd>
          <dt>Total</dt>
          <dd>
            <strong>{formatMoney(document.proposal.total)}</strong>
          </dd>
        </dl>
      </section>
      <footer className="proposal-document-footer">
        <strong>{document.organization.name}</strong>
        <span>
          {[document.organization.email, document.organization.phone]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </footer>
    </article>
  );
}
