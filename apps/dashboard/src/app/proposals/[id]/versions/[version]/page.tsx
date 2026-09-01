import Link from "next/link";
import { notFound } from "next/navigation";
import { ProposalDocumentRenderer } from "../../../_components/proposal-document-renderer";
import type { ProposalDocument } from "../../../../../lib/proposals/document";
import { requireProposalsAccess } from "../../../../../lib/proposals/access";
import { createProposalsDb } from "../../../../../lib/proposals/db";
export default async function Version({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version } = await params;
  const access = await requireProposalsAccess();
  const s = await createProposalsDb();
  const { data: rawData } = await s
    .from("proposal_versions")
    .select("snapshot,version_number,created_at")
    .eq("organization_id", access.organization.id)
    .eq("proposal_id", id)
    .eq("version_number", Number(version))
    .maybeSingle();
  const data = rawData as {
    snapshot: ProposalDocument;
    version_number: number;
    created_at: string;
  } | null;
  if (!data) notFound();
  return (
    <>
      <nav className="proposal-preview-toolbar">
        <Link href={`/proposals/${id}/versions`}>Voltar ao histórico</Link>
        <span>Versão imutável {data.version_number}</span>
      </nav>
      <ProposalDocumentRenderer
        document={data.snapshot as unknown as ProposalDocument}
      />
    </>
  );
}
