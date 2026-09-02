"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProposalsAccess } from "./access";
import { attachmentInputSchema } from "./attachments";
import { createClient } from "../supabase/server";

export async function uploadProposalAttachment(formData: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = String(formData.get("proposalId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File))
    redirect(`/proposals/${proposalId}?attachmentError=validation`);
  const parsed = attachmentInputSchema.safeParse({
    proposalId,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  });
  if (!parsed.success)
    redirect(`/proposals/${proposalId}?attachmentError=validation`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const supabase = await createClient();
  const prepared = await supabase.rpc("prepare_proposal_attachment", {
    target_proposal_id: proposalId,
    attachment_file_name: parsed.data.fileName,
    attachment_mime_type: parsed.data.mimeType,
    attachment_size_bytes: parsed.data.size,
    attachment_checksum_sha256: checksum,
  });
  const value = prepared.data as { id?: string; storage_path?: string } | null;
  if (prepared.error || !value?.id || !value.storage_path)
    redirect(`/proposals/${proposalId}?attachmentError=prepare`);
  const uploaded = await supabase.storage
    .from("proposal-attachments")
    .upload(value.storage_path, bytes, {
      contentType: parsed.data.mimeType,
      upsert: false,
    });
  if (uploaded.error) {
    await supabase.rpc("remove_proposal_attachment", {
      target_attachment_id: value.id,
    });
    redirect(`/proposals/${proposalId}?attachmentError=upload`);
  }
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?attachmentUploaded=1`);
}

export async function removeProposalAttachment(formData: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = String(formData.get("proposalId") ?? "");
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const supabase = await createClient();
  const { data: attachment } = await supabase
    .from("proposal_attachments")
    .select("storage_path")
    .eq("proposal_id", proposalId)
    .eq("id", attachmentId)
    .maybeSingle();
  if (!attachment) redirect(`/proposals/${proposalId}?attachmentError=missing`);
  const storageRemoval = await supabase.storage
    .from("proposal-attachments")
    .remove([attachment.storage_path]);
  if (storageRemoval.error)
    redirect(`/proposals/${proposalId}?attachmentError=immutable`);
  const removed = await supabase.rpc("remove_proposal_attachment", {
    target_attachment_id: attachmentId,
  });
  if (removed.error || !removed.data)
    redirect(`/proposals/${proposalId}?attachmentError=immutable`);
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?attachmentRemoved=1`);
}
