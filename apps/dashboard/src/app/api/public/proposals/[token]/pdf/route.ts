import { NextResponse } from "next/server";
import { hashDeliveryToken } from "../../../../../../lib/proposals/delivery";
import {
  renderProposalPdf,
  proposalPdfFilename,
} from "../../../../../../lib/proposals/pdf";
import { parseProposalSnapshot } from "../../../../../../lib/proposals/snapshot";
import { createPublicServerClient } from "../../../../../../lib/supabase/public-server";
export const runtime = "nodejs";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { data } = await createPublicServerClient().rpc("get_public_proposal", {
    target_token_hash: hashDeliveryToken(token),
    target_record_view: false,
  });
  if (!data)
    return NextResponse.json(
      { message: "Proposta indisponível." },
      { status: 404 },
    );
  const p = data as unknown as {
    snapshot: unknown;
    version: number;
    expired: boolean;
    attachments: Array<{ fileName: string }>;
  };
  if (p.expired)
    return NextResponse.json(
      { message: "Proposta indisponível." },
      { status: 410 },
    );
  const document = parseProposalSnapshot(p.snapshot),
    pdf = await renderProposalPdf({
      document,
      version: p.version,
      attachments: p.attachments,
    });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${proposalPdfFilename(document.proposal.number, p.version)}"`,
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
