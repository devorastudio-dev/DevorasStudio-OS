import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getInternalAuthState } from "../../../../../../../lib/auth/access";
import { hasPermission } from "../../../../../../../lib/auth/permissions";
import {
  proposalPdfFilename,
  renderProposalPdf,
} from "../../../../../../../lib/proposals/pdf";
import { parseProposalSnapshot } from "../../../../../../../lib/proposals/snapshot";
import { createClient } from "../../../../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; version: string }> },
) {
  const startedAt = Date.now();
  const requestId = randomUUID();
  const state = await getInternalAuthState();
  if (!state.access || state.currentLevel !== "aal2")
    return NextResponse.json(
      { message: "Autenticação necessária." },
      { status: 401 },
    );
  const organizationId = state.access.organization.id;
  if (!(await hasPermission("proposals.read", organizationId)))
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  const { id, version: rawVersion } = await params;
  const version = Number(rawVersion);
  if (!Number.isSafeInteger(version) || version < 1)
    return NextResponse.json({ message: "Versão inválida." }, { status: 400 });
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_versions")
    .select("id,snapshot,version_number")
    .eq("organization_id", organizationId)
    .eq("proposal_id", id)
    .eq("version_number", version)
    .maybeSingle();
  if (!data)
    return NextResponse.json(
      { message: "Versão não encontrada." },
      { status: 404 },
    );
  try {
    const document = parseProposalSnapshot(data.snapshot);
    const { data: attachments } = await supabase
      .from("proposal_version_attachments")
      .select("file_name")
      .eq("organization_id", organizationId)
      .eq("proposal_version_id", data.id)
      .order("created_at");
    const pdf = await renderProposalPdf({
      document,
      version: data.version_number,
      attachments: (attachments ?? []).map((item) => ({
        fileName: item.file_name,
      })),
    });
    await supabase.rpc("record_audit_event", {
      event_action: "proposal.version_pdf_generated",
      event_entity_type: "proposal_version",
      event_entity_id: data.id,
      event_outcome: "success",
      event_request_id: requestId,
      event_metadata: {
        version_number: data.version_number,
        duration_ms: Date.now() - startedAt,
      },
    });
    const filename = proposalPdfFilename(
      document.proposal.number,
      data.version_number,
    );
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error(
      JSON.stringify({
        request_id: requestId,
        operation: "proposal_pdf",
        result: "failure",
        technical_code: "render_failed",
        duration_ms: Date.now() - startedAt,
      }),
    );
    return NextResponse.json(
      { message: "Não foi possível gerar o PDF. Tente novamente." },
      { status: 500 },
    );
  }
}
