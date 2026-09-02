import { z } from "zod";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

const extensionsByMimeType: Record<
  (typeof ALLOWED_ATTACHMENT_TYPES)[number],
  string[]
> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

export const attachmentInputSchema = z
  .object({
    proposalId: z.string().uuid(),
    fileName: z.string().trim().min(1).max(180),
    mimeType: z.enum(ALLOWED_ATTACHMENT_TYPES),
    size: z.number().int().min(1).max(MAX_ATTACHMENT_BYTES),
  })
  .superRefine(({ fileName, mimeType }, context) => {
    const normalizedName = fileName.toLocaleLowerCase("en-US");
    if (
      !extensionsByMimeType[mimeType].some((extension) =>
        normalizedName.endsWith(extension),
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "A extensao do arquivo nao corresponde ao tipo informado.",
        path: ["fileName"],
      });
    }
  });

export function attachmentDispositionFilename(value: string): string {
  const safe = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 180);
  return safe || "anexo";
}
