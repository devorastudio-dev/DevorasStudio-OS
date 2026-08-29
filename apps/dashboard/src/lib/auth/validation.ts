import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(1024),
});

export const passwordSchema = z
  .string()
  .min(12, "Use pelo menos 12 caracteres.")
  .max(128, "Use no máximo 128 caracteres.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua um número.");

export const updatePasswordSchema = z
  .object({
    confirmPassword: z.string(),
    password: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export function safeNextPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }

  const parsed = new URL(value, "https://dashboard.invalid");
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function getApplicationUrl(
  source: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const configured = source.APP_URL;

  if (!configured && source.NODE_ENV !== "production") {
    return "http://127.0.0.1:3001";
  }

  if (!configured) {
    throw new Error("APP_URL não está definida.");
  }

  const url = new URL(configured);
  const isLocal =
    url.protocol === "http:" &&
    (url.hostname === "127.0.0.1" || url.hostname === "localhost");

  if (url.protocol !== "https:" && !isLocal) {
    throw new Error("APP_URL deve usar HTTPS fora do ambiente local.");
  }

  return url.toString().replace(/\/$/, "");
}
