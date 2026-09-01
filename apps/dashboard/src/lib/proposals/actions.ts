"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { requireProposalsAccess } from "./access";
import {
  itemSchema,
  proposalSchema,
  proposalUpdateSchema,
  serviceSchema,
  proposalSectionSchema,
  documentSettingsSchema,
} from "./validation";
const f = (d: FormData, n: string) => String(d.get(n) ?? "");
export async function saveService(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const p = serviceSchema.safeParse({
    id: f(d, "id"),
    name: f(d, "name"),
    description: f(d, "description"),
    unit: f(d, "unit"),
    price: f(d, "price"),
    active: d.get("active") === "on",
  });
  if (!p.success) redirect("/proposals/services?error=validation");
  const s = await createClient();
  const result = p.data.id
    ? await s.rpc("update_service", {
        target_service_id: p.data.id,
        service_name: p.data.name,
        service_description: p.data.description ?? "",
        service_unit: p.data.unit,
        service_price: p.data.price,
        target_active: p.data.active,
      })
    : await s.rpc("create_service", {
        service_name: p.data.name,
        service_description: p.data.description ?? "",
        service_unit: p.data.unit,
        service_price: p.data.price,
      });
  if (result.error) redirect("/proposals/services?error=save");
  revalidatePath("/proposals/services");
  redirect("/proposals/services?saved=1");
}
export async function saveProposalSection(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const p = proposalSectionSchema.safeParse({
    proposalId: f(d, "proposalId"),
    sectionId: f(d, "sectionId"),
    sectionType: f(d, "sectionType"),
    title: f(d, "title"),
    content: f(d, "content"),
    visible: d.get("visible") === "on",
  });
  if (!p.success)
    redirect(`/proposals/${f(d, "proposalId")}?error=section-validation`);
  const s = await createClient();
  const { error } = await s.rpc("save_proposal_section", {
    target_proposal_id: p.data.proposalId,
    target_section_id: p.data.sectionId ?? undefined,
    target_section_type: p.data.sectionType,
    section_title: p.data.title,
    section_content: p.data.content,
    target_visible: p.data.visible,
  });
  if (error) redirect(`/proposals/${p.data.proposalId}?error=section`);
  revalidatePath(`/proposals/${p.data.proposalId}`);
  redirect(`/proposals/${p.data.proposalId}?saved=1`);
}
export async function removeProposalSection(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = f(d, "proposalId");
  const s = await createClient();
  const { error } = await s.rpc("remove_proposal_section", {
    target_section_id: f(d, "sectionId"),
  });
  if (error) redirect(`/proposals/${proposalId}?error=section`);
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?saved=1`);
}
export async function moveProposalSection(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = f(d, "proposalId");
  const s = await createClient();
  const { error } = await s.rpc("move_proposal_section", {
    target_section_id: f(d, "sectionId"),
    direction: Number(f(d, "direction")),
  });
  if (error) redirect(`/proposals/${proposalId}?error=section`);
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?saved=1`);
}
export async function updateDocumentSettings(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = f(d, "proposalId");
  const p = documentSettingsSchema.safeParse({
    displayName: f(d, "displayName"),
    email: f(d, "email"),
    phone: f(d, "phone"),
    website: f(d, "website"),
    city: f(d, "city"),
  });
  if (!p.success)
    redirect(`/proposals/${proposalId}?error=settings-validation`);
  const s = await createClient();
  const { error } = await s.rpc("update_proposal_document_settings", {
    settings_display_name: p.data.displayName,
    settings_email: p.data.email ?? undefined,
    settings_phone: p.data.phone ?? undefined,
    settings_website: p.data.website ?? undefined,
    settings_city: p.data.city ?? undefined,
  });
  if (error) redirect(`/proposals/${proposalId}?error=settings`);
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?saved=1`);
}
export async function createProposal(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const p = proposalSchema.safeParse({
    clientId: f(d, "clientId"),
    opportunityId: f(d, "opportunityId"),
    title: f(d, "title"),
    validUntil: f(d, "validUntil"),
  });
  if (!p.success) redirect("/proposals/new?error=validation");
  const s = await createClient();
  const { data, error } = await s.rpc("create_proposal", {
    target_client_id: p.data.clientId,
    target_opportunity_id: p.data.opportunityId ?? undefined,
    proposal_title: p.data.title,
    proposal_valid_until: p.data.validUntil ?? undefined,
  });
  if (error || !data) redirect("/proposals/new?error=save");
  redirect(`/proposals/${data}?created=1`);
}
export async function updateProposal(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const p = proposalUpdateSchema.safeParse({
    id: f(d, "id"),
    title: f(d, "title"),
    validUntil: f(d, "validUntil"),
    discount: f(d, "discount"),
  });
  if (!p.success) redirect(`/proposals/${f(d, "id")}?error=validation`);
  const s = await createClient();
  const { error } = await s.rpc("update_proposal", {
    target_proposal_id: p.data.id,
    proposal_title: p.data.title,
    proposal_valid_until: p.data.validUntil ?? undefined,
    proposal_discount: p.data.discount,
  });
  if (error) redirect(`/proposals/${p.data.id}?error=save`);
  revalidatePath(`/proposals/${p.data.id}`);
  redirect(`/proposals/${p.data.id}?saved=1`);
}
export async function saveProposalItem(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const p = itemSchema.safeParse({
    proposalId: f(d, "proposalId"),
    itemId: f(d, "itemId"),
    serviceId: f(d, "serviceId"),
    name: f(d, "name"),
    description: f(d, "description"),
    quantity: f(d, "quantity"),
    unit: f(d, "unit") || undefined,
    unitPrice: f(d, "unitPrice"),
  });
  if (!p.success)
    redirect(`/proposals/${f(d, "proposalId")}?error=item-validation`);
  const s = await createClient();
  const { error } = await s.rpc("save_proposal_item", {
    target_proposal_id: p.data.proposalId,
    target_item_id: p.data.itemId ?? undefined,
    target_service_id: p.data.serviceId ?? undefined,
    item_name: p.data.name,
    item_description: p.data.description ?? "",
    item_quantity: p.data.quantity,
    item_unit: p.data.unit,
    item_unit_price: p.data.unitPrice ?? undefined,
  });
  if (error) redirect(`/proposals/${p.data.proposalId}?error=item`);
  revalidatePath(`/proposals/${p.data.proposalId}`);
  redirect(`/proposals/${p.data.proposalId}?saved=1`);
}
export async function removeProposalItem(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = f(d, "proposalId"),
    itemId = f(d, "itemId");
  const s = await createClient();
  const { error } = await s.rpc("remove_proposal_item", {
    target_item_id: itemId,
  });
  if (error) redirect(`/proposals/${proposalId}?error=remove`);
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?saved=1`);
}
export async function moveProposalItem(d: FormData) {
  await requireProposalsAccess("proposals.write");
  const proposalId = f(d, "proposalId");
  const direction = Number(f(d, "direction"));
  const s = await createClient();
  const { error } = await s.rpc("move_proposal_item", {
    target_item_id: f(d, "itemId"),
    direction,
  });
  if (error) redirect(`/proposals/${proposalId}?error=move`);
  revalidatePath(`/proposals/${proposalId}`);
  redirect(`/proposals/${proposalId}?saved=1`);
}
