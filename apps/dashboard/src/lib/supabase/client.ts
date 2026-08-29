import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabasePublicEnvironment } from "./environment";

export function createClient() {
  const { publishableKey, url } = getSupabasePublicEnvironment();

  return createBrowserClient<Database>(url, publishableKey);
}
