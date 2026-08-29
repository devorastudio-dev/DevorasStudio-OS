const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

export type SupabasePublicEnvironment = Readonly<{
  publishableKey: string;
  url: string;
}>;

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function getSupabasePublicEnvironment(
  source: EnvironmentSource = process.env,
): SupabasePublicEnvironment {
  const urlValue = source.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!urlValue) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL nao esta definida.");
  }

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nao esta definida.");
  }

  let url: URL;

  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL valida.");
  }

  const isLocalHttp =
    url.protocol === "http:" && LOCAL_HOSTNAMES.has(url.hostname);

  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL deve usar HTTPS, exceto no ambiente local.",
    );
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY deve conter uma chave publicavel.",
    );
  }

  return { publishableKey, url: url.toString().replace(/\/$/, "") };
}
