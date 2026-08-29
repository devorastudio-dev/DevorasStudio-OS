import type { EmailOtpType } from "@supabase/supabase-js";

export type SupportedEmailOtpType = Extract<
  EmailOtpType,
  "invite" | "recovery"
>;

export function parseEmailConfirmation(
  searchParams: URLSearchParams,
): { tokenHash: string; type: SupportedEmailOtpType } | null {
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!tokenHash || (type !== "invite" && type !== "recovery")) {
    return null;
  }

  return { tokenHash, type };
}
