"use server";

import { createPublicSupabaseClient } from "../lib/supabase/server";
import { isAutomatedSubmission, leadSchema } from "../lib/leads/validation";
import type { LeadActionState } from "./lead-action-state";

const value = (data: FormData, key: string) => String(data.get(key) ?? "");

export async function submitLead(
  _previousState: LeadActionState,
  data: FormData,
): Promise<LeadActionState> {
  if (isAutomatedSubmission(value(data, "website"), value(data, "startedAt"))) {
    return {
      status: "success",
      message: "Recebemos sua mensagem. Obrigado pelo contato.",
    };
  }

  const parsed = leadSchema.safeParse({
    fullName: value(data, "fullName"),
    email: value(data, "email"),
    phone: value(data, "phone"),
    company: value(data, "company"),
    serviceInterest: value(data, "serviceInterest"),
    message: value(data, "message"),
    consent: value(data, "consent"),
    landingPath: value(data, "landingPath") || "/",
    utmSource: value(data, "utmSource"),
    utmMedium: value(data, "utmMedium"),
    utmCampaign: value(data, "utmCampaign"),
    utmContent: value(data, "utmContent"),
    utmTerm: value(data, "utmTerm"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos indicados e tente novamente.",
    };
  }

  try {
    const input = parsed.data;
    const { error } = await createPublicSupabaseClient().rpc(
      "submit_public_lead",
      {
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        service_interest: input.serviceInterest,
        message: input.message,
        landing_path: input.landingPath,
        utm_source: input.utmSource,
        utm_medium: input.utmMedium,
        utm_campaign: input.utmCampaign,
        utm_content: input.utmContent,
        utm_term: input.utmTerm,
      },
    );
    if (error) throw error;
    return {
      status: "success",
      message: "Recebemos sua mensagem. Obrigado pelo contato.",
    };
  } catch {
    return {
      status: "error",
      message:
        "Não foi possível enviar agora. Seus dados foram mantidos; tente novamente.",
    };
  }
}
