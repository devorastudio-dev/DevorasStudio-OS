"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCrmAccess } from "./access";
import { createClient } from "../supabase/server";

const conversionSchema = z.string().uuid();

export async function convertOpportunityToClient(formData: FormData) {
  await requireCrmAccess("crm.write");
  const parsed = conversionSchema.safeParse(
    String(formData.get("opportunityId") ?? ""),
  );
  if (!parsed.success) redirect("/crm/pipeline?error=conversion");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "convert_won_opportunity_to_client",
    { target_opportunity_id: parsed.data },
  );
  if (error || !data)
    redirect(`/crm/opportunities/${parsed.data}?error=conversion`);
  revalidatePath("/crm");
  revalidatePath("/crm/clients");
  revalidatePath(`/crm/opportunities/${parsed.data}`);
  redirect(`/crm/clients/${data}?converted=1`);
}
