import Link from "next/link";
import { notFound } from "next/navigation";
import { ProposalDocumentRenderer } from "../../_components/proposal-document-renderer";
import type { ProposalDocument } from "../../../../lib/proposals/document";
import { requireProposalsAccess } from "../../../../lib/proposals/access";
import { createClient } from "../../../../lib/supabase/server";

export default async function ProposalPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requireProposalsAccess();
  const { id } = await params;
  const s = await createClient();
  const [
    { data: proposal },
    { data: items },
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
  const { data: client } = await s
    .from("clients")
    .select("company_id,primary_contact_id,source_lead_id")
    .eq("organization_id", access.organization.id)
    .eq("id", proposal.client_id)
    .maybeSingle();
  const [company, contact, lead] = await Promise.all([
    client?.company_id
      ? s
          .from("crm_companies")
          .select("display_name")
          .eq("id", client.company_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    client?.primary_contact_id
      ? s
          .from("crm_contacts")
          .select("full_name")
          .eq("id", client.primary_contact_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    client?.source_lead_id
      ? s
          .from("leads")
          .select("full_name")
          .eq("id", client.source_lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const document: ProposalDocument = {
    proposal: {
      number: proposal.proposal_number,
      title: proposal.title,
      createdAt: proposal.created_at,
      validUntil: proposal.valid_until,
      subtotal: Number(proposal.subtotal),
      discount: Number(proposal.discount_amount),
      total: Number(proposal.total_amount),
    },
    organization: {
      name: settings?.display_name ?? access.organization.name,
      email: settings?.email ?? null,
      phone: settings?.phone ?? null,
      website: settings?.website ?? null,
      city: settings?.city ?? null,
      logoPath: settings?.logo_path ?? null,
    },
    client: {
      name:
        company.data?.display_name ??
        contact.data?.full_name ??
        lead.data?.full_name ??
        "Cliente",
    },
    sections: (sections ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      content: v.content,
      type: v.section_type,
      visible: v.is_visible,
      position: v.position,
    })),
    items: (items ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      quantity: Number(v.quantity),
      unit: v.unit,
      unitPrice: Number(v.unit_price),
      total: Number(v.line_total ?? 0),
    })),
  };
  return (
    <>
      <nav className="proposal-preview-toolbar" aria-label="Ações do preview">
        <Link href={`/proposals/${id}`}>Voltar ao editor</Link>
        <span>Preview interno · HTML, não PDF oficial</span>
      </nav>
      <ProposalDocumentRenderer document={document} />
    </>
  );
}
