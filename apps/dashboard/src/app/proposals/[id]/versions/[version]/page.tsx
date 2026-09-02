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
    .select("id,snapshot,version_number,created_at")
    .eq("organization_id", access.organization.id)
    .eq("proposal_id", id)
    .eq("version_number", Number(version))
    .maybeSingle();
  const data = rawData as {
    id: string;
    snapshot: ProposalDocument;
    version_number: number;
    created_at: string;
  } | null;
  if (!data) notFound();
  const { data: rawAttachments } = await s
    .from("proposal_version_attachments")
    .select("attachment_id,file_name,size_bytes")
    .eq("organization_id", access.organization.id)
    .eq("proposal_version_id", data.id)
    .order("created_at");
  const attachments = (rawAttachments ?? []) as Array<{
    attachment_id: string;
    file_name: string;
    size_bytes: number;
  }>;
  return (
    <>
      <nav className="proposal-preview-toolbar">
        <Link href={`/proposals/${id}/versions`}>Voltar ao histórico</Link>
        <span>Versão imutável {data.version_number}</span>
        <a href={`/api/proposals/${id}/versions/${data.version_number}/pdf`}>
          Baixar PDF
        </a>
      </nav>
      <ProposalDocumentRenderer
        document={data.snapshot as unknown as ProposalDocument}
      />
      {attachments.length ? (
        <section className="proposal-version-attachments">
          <h2>Anexos desta versão</h2>
          <ul>
            {attachments.map((attachment) => (
              <li key={attachment.attachment_id}>
                <a
                  href={`/api/proposals/${id}/attachments/${attachment.attachment_id}`}
                >
                  {attachment.file_name}
                </a>{" "}
                <small>{Math.ceil(attachment.size_bytes / 1024)} KB</small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
