import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabasePublicEnvironment } from "./environment";

type BrowserClientOptions = Readonly<{
  fetch?: typeof fetch;
  isSingleton?: boolean;
}>;

export function getBrowserSupabaseEnvironment() {
  return getSupabasePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}

export function createClient(options?: BrowserClientOptions) {
  const { publishableKey, url } = getBrowserSupabaseEnvironment();

  return createBrowserClient<Database>(url, publishableKey, {
    global: {
      fetch: options?.fetch,
      headers: { apikey: publishableKey },
    },
    ...(options?.isSingleton === undefined
      ? {}
      : { isSingleton: options.isSingleton }),
  });
}
