import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublicEnvironment } from "./environment";

export function createPublicServerClient() {
  const { url, publishableKey } = getSupabasePublicEnvironment();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createStorageAdminClient() {
  const { url } = getSupabasePublicEnvironment();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret)
    throw new Error(
      "SUPABASE_SECRET_KEY is required for controlled private attachment downloads.",
    );
  return createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
