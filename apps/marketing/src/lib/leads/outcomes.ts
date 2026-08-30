export const leadOutcomes = [
  "persisted",
  "bot_discarded",
  "duplicate",
  "rate_limited",
  "validation_failed",
  "organization_not_found",
  "rpc_failed",
  "unexpected_failure",
] as const;

export type LeadOutcome = (typeof leadOutcomes)[number];

export const rpcLeadOutcomes = [
  "persisted",
  "duplicate",
  "rate_limited",
  "organization_not_found",
] as const;

export type RpcLeadOutcome = (typeof rpcLeadOutcomes)[number];

export function isRpcLeadOutcome(value: unknown): value is RpcLeadOutcome {
  return rpcLeadOutcomes.includes(value as RpcLeadOutcome);
}
