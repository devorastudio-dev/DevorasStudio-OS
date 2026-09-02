import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const proposalDecisionSchema = z.object({
  token: z.string().min(40).max(200),
  decision: z.enum(["accepted", "rejected"]),
  name: z.string().trim().min(2).max(160),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .optional()
    .or(z.literal("")),
  reason: z.string().trim().max(1000).optional(),
  consent: z.literal("on"),
});
export const proposalDeliverySchema = z.object({
  proposalId: z.string().uuid(),
  versionId: z.string().uuid(),
  recipientEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(254)
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
  sendEmail: z.boolean(),
});
export const createDeliveryToken = () => randomBytes(32).toString("base64url");
export const hashDeliveryToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const publicProposalUrl = (token: string) =>
  `${process.env.APP_URL?.replace(/\/$/, "")}/proposal/p/${token}`;
export const escapeEmailHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
