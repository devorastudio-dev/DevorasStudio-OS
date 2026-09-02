import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getInternalAuthState } from "../../../../../../lib/auth/access";
import { hasPermission } from "../../../../../../lib/auth/permissions";
import { attachmentDispositionFilename } from "../../../../../../lib/proposals/attachments";
import { createClient } from "../../../../../../lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const state = await getInternalAuthState();
  if (!state.access || state.currentLevel !== "aal2")
    return NextResponse.json(
      { message: "Autenticação necessária." },
      { status: 401 },
    );
  if (!(await hasPermission("proposals.read", state.access.organization.id)))
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  const { id, attachmentId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposal_attachments")
    .select("id,file_name,storage_path,mime_type")
    .eq("organization_id", state.access.organization.id)
    .eq("proposal_id", id)
    .eq("id", attachmentId)
    .maybeSingle();
  if (!data)
    return NextResponse.json(
      { message: "Anexo não encontrado." },
      { status: 404 },
    );
  const downloaded = await supabase.storage
    .from("proposal-attachments")
    .download(data.storage_path);
  if (downloaded.error)
    return NextResponse.json(
      { message: "Não foi possível baixar o anexo." },
      { status: 500 },
    );
  await supabase.rpc("record_audit_event", {
    event_action: "proposal.attachment_downloaded",
    event_entity_type: "proposal_attachment",
    event_entity_id: data.id,
    event_outcome: "success",
    event_request_id: randomUUID(),
    event_metadata: {},
  });
  return new Response(downloaded.data, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${attachmentDispositionFilename(data.file_name)}"`,
      "Content-Type": data.mime_type,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
