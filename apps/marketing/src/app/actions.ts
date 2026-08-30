"use server";

import { isRpcLeadOutcome } from "../lib/leads/outcomes";
import type { LeadOutcome } from "../lib/leads/outcomes";
import { evaluateSubmissionTiming, leadSchema } from "../lib/leads/validation";
import { createPublicSupabaseClient } from "../lib/supabase/server";
import type { LeadActionState } from "./lead-action-state";

const value = (data: FormData, key: string) => String(data.get(key) ?? "");
const successState: LeadActionState = {
  status: "success",
  message: "Recebemos sua mensagem. Obrigado pelo contato.",
};
const failureState: LeadActionState = {
  status: "error",
  message:
    "Não foi possível enviar agora. Seus dados foram mantidos; tente novamente.",
};

function technicalCode(value: unknown) {
  if (typeof value !== "object" || value === null || !("code" in value))
    return "unclassified";
  const code = String(value.code);
  return /^[A-Za-z0-9_-]{1,40}$/.test(code) ? code : "invalid_code";
}

function logOutcome(
  requestId: string,
  outcome: LeadOutcome,
  startedAt: number,
  code = "none",
) {
  console.info(
    JSON.stringify({
      request_id: requestId,
      outcome,
      technical_code: code,
      duration_ms: Math.max(0, Date.now() - startedAt),
    }),
  );
}

export async function submitLead(
  _previousState: LeadActionState,
  data: FormData,
): Promise<LeadActionState> {
  const requestId = crypto.randomUUID();
  const actionStartedAt = Date.now();

  if (value(data, "fax_extension_7f3a")) {
    logOutcome(requestId, "bot_discarded", actionStartedAt);
    return successState;
  }

  const timing = evaluateSubmissionTiming(value(data, "startedAt"));
  if (timing !== "valid") {
    logOutcome(requestId, "validation_failed", actionStartedAt, timing);
    return failureState;
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
    logOutcome(requestId, "validation_failed", actionStartedAt, "invalid_form");
    return {
      status: "error",
      message: "Revise os campos indicados e tente novamente.",
    };
  }

  try {
    const input = parsed.data;
    const { data: outcome, error } = await createPublicSupabaseClient().rpc(
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
    if (error) {
      logOutcome(
        requestId,
        "rpc_failed",
        actionStartedAt,
        technicalCode(error),
      );
      return failureState;
    }
    if (!isRpcLeadOutcome(outcome)) {
      logOutcome(requestId, "rpc_failed", actionStartedAt, "invalid_outcome");
      return failureState;
    }

    logOutcome(requestId, outcome, actionStartedAt);
    if (outcome === "persisted" || outcome === "duplicate") return successState;
    return failureState;
  } catch (error) {
    logOutcome(
      requestId,
      "unexpected_failure",
      actionStartedAt,
      technicalCode(error),
    );
    return failureState;
  }
}
