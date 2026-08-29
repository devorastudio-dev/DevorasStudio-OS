// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { createClient } from "./client";

const syntheticUrl = "https://transport-test.supabase.co";
const syntheticKey = "sb_publishable_TRANSPORT_TEST_ONLY";

function response(body: object) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

describe("browser Supabase client transport", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa URL e publishable key e preserva apikey no enrollment MFA", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", syntheticUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", syntheticKey);
    const requests: Array<{ headers: Headers; url: string }> = [];
    const transport: typeof fetch = vi.fn(async (input, init) => {
      const url = input instanceof Request ? input.url : input.toString();
      const headers = new Headers(
        input instanceof Request ? input.headers : init?.headers,
      );
      requests.push({ headers, url });

      if (url.endsWith("/auth/v1/user")) {
        return response({
          user: {
            aud: "authenticated",
            created_at: "2026-01-01T00:00:00Z",
            id: "00000000-0000-4000-8000-000000000901",
            role: "authenticated",
          },
        });
      }

      return response({
        id: "synthetic-factor",
        totp: { qr_code: "synthetic-qr", secret: "synthetic", uri: "" },
        type: "totp",
      });
    });
    const client = createClient({ fetch: transport, isSingleton: false });
    const payload = btoa(
      JSON.stringify({
        exp: 4_102_444_800,
        role: "authenticated",
        sub: "00000000-0000-4000-8000-000000000901",
      }),
    );
    await client.auth.setSession({
      access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.synthetic`,
      refresh_token: "synthetic-refresh",
    });

    await client.auth.mfa.enroll({ factorType: "totp" });

    const enrollment = requests.find((request) =>
      request.url.endsWith("/auth/v1/factors"),
    );
    expect(enrollment?.url).toBe(`${syntheticUrl}/auth/v1/factors`);
    expect(enrollment?.headers.get("apikey")).toBe(syntheticKey);
    expect(enrollment?.headers.get("authorization")).toMatch(/^Bearer /);
  });
});
