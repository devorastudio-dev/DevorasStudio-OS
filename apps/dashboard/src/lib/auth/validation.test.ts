import { describe, expect, it } from "vitest";

import {
  getApplicationUrl,
  loginSchema,
  safeNextPath,
  updatePasswordSchema,
} from "./validation";

describe("validação de autenticação", () => {
  it("normaliza um login válido", () => {
    expect(
      loginSchema.parse({
        email: " PESSOA@EXAMPLE.INVALID ",
        password: "senha",
      }),
    ).toEqual({ email: "pessoa@example.invalid", password: "senha" });
  });

  it("rejeita senha nova fraca e confirmação divergente", () => {
    expect(
      updatePasswordSchema.safeParse({
        confirmPassword: "outra",
        password: "fraca",
      }).success,
    ).toBe(false);
  });

  it("aceita senha nova coerente", () => {
    expect(
      updatePasswordSchema.safeParse({
        confirmPassword: "SenhaFicticia123",
        password: "SenhaFicticia123",
      }).success,
    ).toBe(true);
  });

  it("preserva redirecionamento interno", () => {
    expect(safeNextPath("/ui?origem=login")).toBe("/ui?origem=login");
  });

  it.each([
    "https://example.invalid/roubo",
    "//example.invalid/roubo",
    "/\\example.invalid",
  ])("rejeita redirecionamento externo: %s", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("exige APP_URL HTTPS em produção", () => {
    expect(() =>
      getApplicationUrl({
        APP_URL: "http://example.invalid",
        NODE_ENV: "production",
      }),
    ).toThrow("HTTPS");
  });
});
