import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabasePublicEnvironment } from "./environment";

export function getBrowserSupabaseEnvironment() {
  return getSupabasePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}

export function createClient() {
  const { publishableKey, url } = getBrowserSupabaseEnvironment();

  return createBrowserClient<Database>(url, publishableKey);
}
