import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Button, Card, Input, Label, Textarea } from "@devora/ui";
import { ProposalDocumentRenderer } from "../../../proposals/_components/proposal-document-renderer";
import { decideProposal } from "../../../../lib/proposals/delivery-actions";
import { hashDeliveryToken } from "../../../../lib/proposals/delivery";
import { parseProposalSnapshot } from "../../../../lib/proposals/snapshot";
import { createPublicServerClient } from "../../../../lib/supabase/public-server";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function PublicProposal({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; decided?: string }>;
}) {
  const { token } = await params,
    q = await searchParams;
  if (token.length < 40) notFound();
  const db = createPublicServerClient();
  const { data } = await db.rpc("get_public_proposal", {
    target_token_hash: hashDeliveryToken(token),
    target_record_view: true,
  });
  if (!data) notFound();
  const payload = data as unknown as {
    snapshot: unknown;
    version: number;
    expired: boolean;
    status: string;
    attachments: Array<{ id: string; fileName: string }>;
  };
  const document = parseProposalSnapshot(payload.snapshot);
  const terminal = ["accepted", "rejected"].includes(payload.status);
  return (
    <main className="public-proposal-shell">
      <header>
        <strong>DEVORA STUDIO</strong>
        <span>Proposta comercial · Versão {payload.version}</span>
      </header>
      {q.error ? (
        <Alert variant="error">
          Não foi possível registrar sua decisão. Revise os dados e tente
          novamente.
        </Alert>
      ) : null}
      {q.decided ? (
        <Alert variant="success">
          Sua decisão foi registrada com segurança.
        </Alert>
      ) : null}
      <ProposalDocumentRenderer document={document} />
      <Card>
        <h2>Documentos</h2>
        <a href={`/api/public/proposals/${encodeURIComponent(token)}/pdf`}>
          Baixar PDF
        </a>
        {payload.attachments.map((a) => (
          <p key={a.id}>
            <a
              href={`/api/public/proposals/${encodeURIComponent(token)}/attachments/${a.id}`}
            >
              {a.fileName}
            </a>
          </p>
        ))}
      </Card>
      <Card>
        <h2>Decisão</h2>
        {payload.expired ? (
          <Alert variant="warning">
            Esta proposta não está mais disponível para aceite.
          </Alert>
        ) : terminal ? (
          <p>Esta proposta já possui uma decisão final.</p>
        ) : (
          <>
            <p>
              Confirme conscientemente a versão {payload.version} no valor de{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(document.proposal.total)}
              .
            </p>
            <form action={decideProposal} className="crm-form">
              <input type="hidden" name="token" value={token} />
              <Label htmlFor="responsibleName">Nome do responsável</Label>
              <Input id="responsibleName" name="name" required minLength={2} />
              <Label htmlFor="responsibleEmail">E-mail (opcional)</Label>
              <Input id="responsibleEmail" name="email" type="email" />
              <Label htmlFor="decisionReason">
                Motivo da recusa (opcional)
              </Label>
              <Textarea id="decisionReason" name="reason" maxLength={1000} />
              <label>
                <input type="checkbox" name="consent" required /> Li e concordo
                com os termos apresentados nesta proposta.
              </label>
              <div className="crm-inline-links">
                <Button name="decision" value="accepted">
                  Confirmar aceite
                </Button>
                <Button name="decision" value="rejected" variant="secondary">
                  Recusar proposta
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
