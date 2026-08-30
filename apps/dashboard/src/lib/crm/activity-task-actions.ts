"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCrmAccess } from "./access";
import {
  activitySchema,
  safeCrmReturn,
  taskSchema,
  taskTransitionSchema,
} from "./activity-task-validation";
import { createClient } from "../supabase/server";
const field = (data: FormData, name: string) => String(data.get(name) ?? "");
const common = (data: FormData) => ({
  leadId: field(data, "leadId"),
  opportunityId: field(data, "opportunityId"),
  companyId: field(data, "companyId"),
  contactId: field(data, "contactId"),
  assignedMembershipId: field(data, "assignedMembershipId"),
  returnTo: field(data, "returnTo"),
});
export async function createCrmActivity(data: FormData) {
  await requireCrmAccess("crm.write");
  const parsed = activitySchema.safeParse({
    ...common(data),
    activityType: field(data, "activityType"),
    title: field(data, "title"),
    description: field(data, "description"),
    occurredAt: field(data, "occurredAt"),
  });
  const back = safeCrmReturn(field(data, "returnTo"));
  if (!parsed.success) redirect(`${back}?error=activity`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_crm_activity", {
    activity_kind: parsed.data.activityType,
    activity_title: parsed.data.title,
    activity_description: parsed.data.description || "",
    activity_occurred_at: parsed.data.occurredAt,
    target_assigned_membership_id: parsed.data.assignedMembershipId,
    target_lead_id: parsed.data.leadId || undefined,
    target_opportunity_id: parsed.data.opportunityId || undefined,
    target_company_id: parsed.data.companyId || undefined,
    target_contact_id: parsed.data.contactId || undefined,
  });
  if (error) redirect(`${back}?error=activity`);
  revalidatePath(back);
  redirect(`${back}?created=activity`);
}
export async function createCrmTask(data: FormData) {
  await requireCrmAccess("crm.write");
  const parsed = taskSchema.safeParse({
    ...common(data),
    title: field(data, "title"),
    description: field(data, "description"),
    dueAt: field(data, "dueAt"),
  });
  const back = safeCrmReturn(field(data, "returnTo"));
  if (!parsed.success) redirect(`${back}?error=task`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_crm_task", {
    task_title: parsed.data.title,
    task_description: parsed.data.description || "",
    task_due_at: parsed.data.dueAt,
    target_assigned_membership_id: parsed.data.assignedMembershipId,
    target_lead_id: parsed.data.leadId || undefined,
    target_opportunity_id: parsed.data.opportunityId || undefined,
    target_company_id: parsed.data.companyId || undefined,
    target_contact_id: parsed.data.contactId || undefined,
  });
  if (error) redirect(`${back}?error=task`);
  revalidatePath(back);
  revalidatePath("/crm/tasks");
  redirect(`${back}?created=task`);
}
export async function transitionCrmTask(data: FormData) {
  await requireCrmAccess("crm.write");
  const parsed = taskTransitionSchema.safeParse({
    taskId: field(data, "taskId"),
    version: field(data, "version"),
    status: field(data, "status"),
    returnTo: field(data, "returnTo"),
  });
  const back = safeCrmReturn(field(data, "returnTo"));
  if (!parsed.success) redirect(`${back}?error=task`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_crm_task", {
    target_task_id: parsed.data.taskId,
    expected_version: parsed.data.version,
    target_status: parsed.data.status,
  });
  if (error) redirect(`${back}?error=task`);
  revalidatePath(back);
  revalidatePath("/crm/tasks");
  redirect(`${back}?updated=task`);
}
