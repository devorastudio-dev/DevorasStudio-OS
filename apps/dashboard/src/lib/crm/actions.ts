"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { requireCrmAccess } from "./access";
import {
  companySchema,
  contactSchema,
  formObject,
  leadSchema,
  leadUpdateSchema,
} from "./validation";

function pathValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createLead(formData: FormData) {
  const access = await requireCrmAccess("crm.write");
  const parsed = leadSchema.safeParse({
    ...formObject(formData),
    assignedMembershipId: pathValue(formData, "assignedMembershipId"),
    companyId: pathValue(formData, "companyId"),
    contactId: pathValue(formData, "contactId"),
  });
  if (!parsed.success) redirect("/crm/leads/new?error=validation");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      organization_id: access.organization.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      company: parsed.data.companyText,
      service_interest: parsed.data.serviceInterest,
      message: parsed.data.message,
      source: parsed.data.source,
      source_detail: parsed.data.sourceDetail,
      landing_path: "/crm/manual",
      consented_at: null,
      consent_version: "manual",
      assigned_membership_id: parsed.data.assignedMembershipId,
      company_id: parsed.data.companyId,
      contact_id: parsed.data.contactId,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/crm/leads/new?error=save");
  revalidatePath("/crm");
  redirect(`/crm/leads/${data.id}?created=1`);
}

export async function updateLead(formData: FormData) {
  const access = await requireCrmAccess("crm.write");
  const parsed = leadUpdateSchema.safeParse({
    ...formObject(formData),
    archived: formData.get("archived") === "true",
  });
  if (!parsed.success)
    redirect(`/crm/leads/${pathValue(formData, "id")}?error=validation`);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({
      triage_status: parsed.data.triageStatus,
      disqualification_reason: parsed.data.disqualificationReason,
      assigned_membership_id: parsed.data.assignedMembershipId,
      company_id: parsed.data.companyId,
      contact_id: parsed.data.contactId,
      archived_at: parsed.data.archived ? new Date().toISOString() : null,
    })
    .eq("organization_id", access.organization.id)
    .eq("id", parsed.data.id)
    .eq("version", parsed.data.version)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect(`/crm/leads/${parsed.data.id}?error=conflict`);
  revalidatePath("/crm");
  redirect(`/crm/leads/${parsed.data.id}?saved=1`);
}

export async function createCompany(formData: FormData) {
  const access = await requireCrmAccess("crm.write");
  const parsed = companySchema.safeParse(formObject(formData));
  if (!parsed.success) redirect("/crm/companies/new?error=validation");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_companies")
    .insert({
      organization_id: access.organization.id,
      display_name: parsed.data.displayName,
      normalized_name: parsed.data.displayName.toLowerCase(),
      website: parsed.data.website,
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: parsed.data.source,
      source_detail: parsed.data.sourceDetail,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/crm/companies/new?error=save");
  redirect(`/crm/companies/${data.id}?created=1`);
}

export async function updateCompany(formData: FormData) {
  const access = await requireCrmAccess("crm.write");
  const id = pathValue(formData, "id");
  const parsed = companySchema.safeParse(formObject(formData));
  if (!parsed.success) redirect(`/crm/companies/${id}?error=validation`);
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_companies")
    .update({
      display_name: parsed.data.displayName,
      website: parsed.data.website,
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: parsed.data.source,
      source_detail: parsed.data.sourceDetail,
      notes: parsed.data.notes,
      state:
        pathValue(formData, "state") === "archived" ? "archived" : "active",
    })
    .eq("organization_id", access.organization.id)
    .eq("id", id);
  if (error) redirect(`/crm/companies/${id}?error=save`);
  revalidatePath("/crm/companies");
  redirect(`/crm/companies/${id}?saved=1`);
}

export async function createContact(formData: FormData) {
  const access = await requireCrmAccess("crm.write");
  const parsed = contactSchema.safeParse({
    ...formObject(formData),
    isPrimary: formData.get("isPrimary") === "on",
  });
  if (!parsed.success) redirect("/crm/contacts/new?error=validation");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_contacts")
    .insert({
      organization_id: access.organization.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      job_title: parsed.data.jobTitle,
      company_id: parsed.data.companyId,
      is_primary: parsed.data.isPrimary,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/crm/contacts/new?error=save");
  redirect(`/crm/contacts/${data.id}?created=1`);
}

export async function updateContact(formData: FormData) {
  const access = await requireCrmAccess("crm.write");
  const id = pathValue(formData, "id");
  const parsed = contactSchema.safeParse({
    ...formObject(formData),
    isPrimary: formData.get("isPrimary") === "on",
  });
  if (!parsed.success) redirect(`/crm/contacts/${id}?error=validation`);
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_contacts")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      job_title: parsed.data.jobTitle,
      company_id: parsed.data.companyId,
      is_primary: parsed.data.isPrimary,
      state:
        pathValue(formData, "state") === "archived" ? "archived" : "active",
    })
    .eq("organization_id", access.organization.id)
    .eq("id", id);
  if (error) redirect(`/crm/contacts/${id}?error=save`);
  revalidatePath("/crm/contacts");
  redirect(`/crm/contacts/${id}?saved=1`);
}
