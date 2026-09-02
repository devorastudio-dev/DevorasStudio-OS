"use server";
import { Resend } from "resend";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProposalsAccess } from "./access";
import { createClient } from "../supabase/server";
import {
  createDeliveryToken,
  escapeEmailHtml,
  hashDeliveryToken,
  proposalDecisionSchema,
  proposalDeliverySchema,
  publicProposalUrl,
} from "./delivery";
import { createPublicServerClient } from "../supabase/public-server";

const value = (data: FormData, key: string) => String(data.get(key) ?? "");
export async function deliverProposal(data: FormData) {
  await requireProposalsAccess("proposals.write");
  const parsed = proposalDeliverySchema.safeParse({
    proposalId: value(data, "proposalId"),
    versionId: value(data, "versionId"),
    recipientEmail: value(data, "recipientEmail"),
    message: value(data, "message"),
    sendEmail: data.get("sendEmail") === "on",
  });
  if (!parsed.success)
    redirect(
      `/proposals/${value(data, "proposalId")}?deliveryError=validation`,
    );
  const token = createDeliveryToken(),
    hash = hashDeliveryToken(token),
    db = await createClient();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: deliveryId, error } = await db.rpc(
    "prepare_proposal_delivery",
    {
      target_version_id: parsed.data.versionId,
      target_token_hash: hash,
      target_expires_at: expiresAt,
      target_recipient_email: parsed.data.recipientEmail || undefined,
      target_message: parsed.data.message || undefined,
    },
  );
  if (error || !deliveryId)
    redirect(`/proposals/${parsed.data.proposalId}?deliveryError=prepare`);
  const link = publicProposalUrl(token);
  if (parsed.data.sendEmail) {
    const apiKey = process.env.RESEND_API_KEY,
      from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from || !parsed.data.recipientEmail) {
      await db.rpc("fail_proposal_delivery", {
        target_delivery_id: deliveryId,
      });
      redirect(
        `/proposals/${parsed.data.proposalId}?deliveryError=email-config`,
      );
    }
    const result = await new Resend(apiKey).emails.send(
      {
        from,
        to: [parsed.data.recipientEmail],
        subject: "Sua proposta comercial — Devora Studio",
        html: `<div style="font-family:Arial,sans-serif"><h1>Sua proposta está pronta</h1><p>${escapeEmailHtml(parsed.data.message || "Preparamos sua proposta comercial.")}</p><p><a href="${link}">Ver proposta</a></p></div>`,
        text: `Sua proposta está pronta. Acesse: ${link}`,
      },
      { idempotencyKey: `proposal-delivery/${deliveryId}` },
    );
    if (result.error) {
      await db.rpc("fail_proposal_delivery", {
        target_delivery_id: deliveryId,
      });
      redirect(`/proposals/${parsed.data.proposalId}?deliveryError=email`);
    }
  }
  const activated = await db.rpc("activate_proposal_delivery", {
    target_delivery_id: deliveryId,
    target_resent: false,
  });
  if (activated.error)
    redirect(`/proposals/${parsed.data.proposalId}?deliveryError=activate`);
  revalidatePath(`/proposals/${parsed.data.proposalId}`);
  redirect(
    `/proposals/${parsed.data.proposalId}?delivered=1&publicLink=${encodeURIComponent(link)}`,
  );
}
export async function revokeProposalLink(data: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = value(data, "proposalId"),
    db = await createClient();
  await db.rpc("revoke_proposal_delivery", {
    target_delivery_id: value(data, "deliveryId"),
  });
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?revoked=1`);
}
export async function decideProposal(data: FormData) {
  const parsed = proposalDecisionSchema.safeParse({
    token: value(data, "token"),
    decision: value(data, "decision"),
    name: value(data, "name"),
    email: value(data, "email"),
    reason: value(data, "reason"),
    consent: value(data, "consent"),
  });
  if (!parsed.success)
    redirect(
      `/proposal/p/${encodeURIComponent(value(data, "token"))}?error=validation`,
    );
  const db = createPublicServerClient();
  const { error } = await db.rpc("decide_public_proposal", {
    target_token_hash: hashDeliveryToken(parsed.data.token),
    target_decision: parsed.data.decision,
    target_name: parsed.data.name,
    target_email: parsed.data.email || undefined,
    target_reason: parsed.data.reason || undefined,
  });
  redirect(
    `/proposal/p/${encodeURIComponent(parsed.data.token)}?${error ? "error=decision" : "decided=1"}`,
  );
}
