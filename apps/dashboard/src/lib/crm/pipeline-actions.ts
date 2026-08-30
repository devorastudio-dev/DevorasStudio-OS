"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCrmAccess } from "./access";
import {
  createOpportunitySchema,
  moveOpportunitySchema,
  updateOpportunitySchema,
} from "./pipeline-validation";
import { createClient } from "../supabase/server";

const field = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function createOpportunityFromLead(formData: FormData) {
  await requireCrmAccess("crm.write");
  const parsed = createOpportunitySchema.safeParse({
    leadId: field(formData, "leadId"),
    title: field(formData, "title"),
    estimatedValue: field(formData, "estimatedValue"),
  });
  if (!parsed.success)
    redirect(`/crm/leads/${field(formData, "leadId")}?error=opportunity`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_opportunity_from_lead", {
    target_lead_id: parsed.data.leadId,
    opportunity_title: parsed.data.title || undefined,
    opportunity_value: parsed.data.estimatedValue ?? undefined,
  });
  if (error || !data)
    redirect(`/crm/leads/${parsed.data.leadId}?error=opportunity`);
  revalidatePath("/crm/pipeline");
  redirect(`/crm/opportunities/${data}?created=1`);
}

export async function moveOpportunity(formData: FormData) {
  await requireCrmAccess("crm.write");
  const parsed = moveOpportunitySchema.safeParse({
    opportunityId: field(formData, "opportunityId"),
    stageId: field(formData, "stageId"),
    version: field(formData, "version"),
    lossReason: field(formData, "lossReason"),
    lossDetail: field(formData, "lossDetail"),
  });
  const id = field(formData, "opportunityId");
  if (!parsed.success) redirect(`/crm/opportunities/${id}?error=validation`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("move_opportunity", {
    target_opportunity_id: parsed.data.opportunityId,
    target_stage_id: parsed.data.stageId,
    expected_version: parsed.data.version,
    target_loss_reason: parsed.data.lossReason || undefined,
    target_loss_detail: parsed.data.lossDetail || undefined,
  });
  if (error) redirect(`/crm/opportunities/${id}?error=move`);
  revalidatePath("/crm/pipeline");
  redirect(`/crm/opportunities/${id}?moved=1`);
}

export async function updateOpportunity(formData: FormData) {
  await requireCrmAccess("crm.write");
  const id = field(formData, "opportunityId");
  const parsed = updateOpportunitySchema.safeParse({
    opportunityId: id,
    version: field(formData, "version"),
    title: field(formData, "title"),
    estimatedValue: field(formData, "estimatedValue"),
    assignedMembershipId: field(formData, "assignedMembershipId"),
    archived: formData.get("archived") === "on",
  });
  if (!parsed.success) redirect(`/crm/opportunities/${id}?error=validation`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_opportunity", {
    target_opportunity_id: id,
    expected_version: parsed.data.version,
    opportunity_title: parsed.data.title,
    opportunity_value: parsed.data.estimatedValue ?? undefined,
    target_assigned_membership_id:
      parsed.data.assignedMembershipId || undefined,
    target_archived: parsed.data.archived,
  });
  if (error) redirect(`/crm/opportunities/${id}?error=save`);
  revalidatePath("/crm/pipeline");
  redirect(`/crm/opportunities/${id}?saved=1`);
}
