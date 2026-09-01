import Link from "next/link";
import { Alert, Card } from "@devora/ui";
import { requireProposalsAccess } from "../../../../lib/proposals/access";
import { createProposalsDb } from "../../../../lib/proposals/db";
export default async function Versions({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireProposalsAccess();
  const s = await createProposalsDb();
  const { data: rawData } = await s
    .from("proposal_versions")
    .select("version_number,created_at")
    .eq("organization_id", access.organization.id)
    .eq("proposal_id", id)
    .order("version_number", { ascending: false });
  const data = (rawData ?? []) as Array<{
    version_number: number;
    created_at: string;
  }>;
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Proposta</p>
          <h1>Histórico de versões</h1>
        </div>
        <Link href={`/proposals/${id}`}>Voltar</Link>
      </header>
      <Card>
        {data?.length ? (
          data.map((v) => (
            <p key={v.version_number}>
              <Link href={`/proposals/${id}/versions/${v.version_number}`}>
                Versão {v.version_number}
              </Link>{" "}
              · {new Date(v.created_at).toLocaleString("pt-BR")}
            </p>
          ))
        ) : (
          <Alert variant="warning">Nenhuma versão criada.</Alert>
        )}
      </Card>
    </>
  );
}
