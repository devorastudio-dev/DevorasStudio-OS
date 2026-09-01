import Link from "next/link";
import { Alert, Badge, Button, Card, Input, Label, Textarea } from "@devora/ui";
import { requireProposalsAccess } from "../../../lib/proposals/access";
import { saveProposalTemplate } from "../../../lib/proposals/actions";
import { createProposalsDb } from "../../../lib/proposals/db";
export default async function Templates() {
  const access = await requireProposalsAccess();
  const s = await createProposalsDb();
  const { data: rawData } = await s
    .from("proposal_templates")
    .select("id,name,description,is_active,updated_at")
    .eq("organization_id", access.organization.id)
    .order("name");
  const data = (rawData ?? []) as Array<{
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    updated_at: string;
  }>;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Propostas</p>
          <h1>Modelos</h1>
          <p>Conteúdo reutilizável e versionado.</p>
        </div>
        <Link href="/proposals">Voltar</Link>
      </header>
      <Card>
        <h2>Novo modelo</h2>
        <form action={saveProposalTemplate} className="crm-form">
          <input type="hidden" name="id" value="" />
          <input type="hidden" name="active" value="on" />
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" maxLength={500} />
          </div>
          <Button>Criar modelo</Button>
        </form>
      </Card>
      {data?.length ? (
        <div className="crm-card-list">
          {data.map((t) => (
            <Link
              className="crm-list-card"
              href={`/proposals/templates/${t.id}`}
              key={t.id}
            >
              <div>
                <strong>{t.name}</strong>
                <span>{t.description || "Sem descrição"}</span>
              </div>
              <Badge variant="neutral">
                {t.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <Alert variant="warning">Nenhum modelo criado.</Alert>
      )}
    </>
  );
}
