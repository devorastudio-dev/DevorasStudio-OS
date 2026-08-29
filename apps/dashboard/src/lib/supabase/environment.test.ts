import { describe, expect, it } from "vitest";

import { getSupabasePublicEnvironment } from "./environment";

describe("getSupabasePublicEnvironment", () => {
  it("aceita uma URL HTTPS e uma chave publicavel", () => {
    expect(
      getSupabasePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co/",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_example",
      url: "https://example-project.supabase.co",
    });
  });

  it("aceita HTTP somente em enderecos locais", () => {
    expect(
      getSupabasePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }).url,
    ).toBe("http://127.0.0.1:54321");
  });

  it("rejeita chave que nao seja publicavel", () => {
    expect(() =>
      getSupabasePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_example",
        NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
      }),
    ).toThrow("chave publicavel");
  });
});
