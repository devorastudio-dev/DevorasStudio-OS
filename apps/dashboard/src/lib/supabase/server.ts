import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { getSupabasePublicEnvironment } from "./environment";

export async function createClient() {
  const cookieStore = await cookies();
  const { publishableKey, url } = getSupabasePublicEnvironment();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components nao podem gravar cookies. A atualizacao de sessao
          // deve ser conectada ao Proxy quando a autenticacao for implementada.
        }
      },
    },
  });
}
