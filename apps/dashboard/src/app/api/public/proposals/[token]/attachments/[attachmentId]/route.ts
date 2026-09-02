import { NextResponse } from "next/server";
import { hashDeliveryToken } from "../../../../../../../lib/proposals/delivery";
import { attachmentDispositionFilename } from "../../../../../../../lib/proposals/attachments";
import {
  createPublicServerClient,
  createStorageAdminClient,
} from "../../../../../../../lib/supabase/public-server";
export const runtime = "nodejs";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ token: string; attachmentId: string }> },
) {
  const { token, attachmentId } = await params;
  const { data } = await createPublicServerClient().rpc("get_public_proposal", {
    target_token_hash: hashDeliveryToken(token),
    target_record_view: false,
  });
  if (!data)
    return NextResponse.json(
      { message: "Arquivo indisponível." },
      { status: 404 },
    );
  const p = data as unknown as {
    expired: boolean;
    attachments: Array<{ id: string; fileName: string }>;
  };
  const allowed = p.attachments.find((a) => a.id === attachmentId);
  if (p.expired || !allowed)
    return NextResponse.json(
      { message: "Arquivo indisponível." },
      { status: 404 },
    );
  const admin = createStorageAdminClient();
  const { data: row } = await admin
    .from("proposal_attachments")
    .select("storage_path,mime_type")
    .eq("id", attachmentId)
    .maybeSingle();
  if (!row)
    return NextResponse.json(
      { message: "Arquivo indisponível." },
      { status: 404 },
    );
  const { data: file, error } = await admin.storage
    .from("proposal-attachments")
    .download(row.storage_path);
  if (error)
    return NextResponse.json(
      { message: "Arquivo indisponível." },
      { status: 404 },
    );
  return new Response(file, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": row.mime_type,
      "Content-Disposition": `attachment; filename="${attachmentDispositionFilename(allowed.fileName)}"`,
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
