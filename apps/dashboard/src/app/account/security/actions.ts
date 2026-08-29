"use server";

import { revalidatePath } from "next/cache";

import { getInternalAuthState } from "../../../lib/auth/access";
import { createClient } from "../../../lib/supabase/server";

export async function removeMfaFactor(formData: FormData) {
  const factorId = formData.get("factorId")?.toString();
  const state = await getInternalAuthState();
  if (
    !factorId ||
    state.destination !== "allowed" ||
    state.currentLevel !== "aal2"
  )
    return;
  if (
    state.factors.length <= 1 ||
    !state.factors.some((factor) => factor.id === factorId)
  )
    return;
  const supabase = await createClient();
  await supabase.auth.mfa.unenroll({ factorId });
  await supabase.auth.refreshSession();
  revalidatePath("/account/security");
}
