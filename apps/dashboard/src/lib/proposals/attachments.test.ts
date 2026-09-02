import { describe, expect, it } from "vitest";
import {
  attachmentDispositionFilename,
  attachmentInputSchema,
  MAX_ATTACHMENT_BYTES,
} from "./attachments";

describe("anexos de propostas", () => {
  const proposalId = "00000000-0000-4000-8000-000000000001";
  it.each([
    ["application/pdf", "arquivo.pdf"],
    ["image/png", "arquivo.png"],
    ["image/jpeg", "arquivo.jpeg"],
  ] as const)("aceita %s", (mimeType, fileName) =>
    expect(
      attachmentInputSchema.safeParse({
        proposalId,
        fileName,
        mimeType,
        size: 100,
      }).success,
    ).toBe(true),
  );
  it("nega extensao incoerente com o MIME", () =>
    expect(
      attachmentInputSchema.safeParse({
        proposalId,
        fileName: "contrato.png",
        mimeType: "application/pdf",
        size: 100,
      }).success,
    ).toBe(false));
  it("nega MIME, tamanho e filename inválidos", () => {
    expect(
      attachmentInputSchema.safeParse({
        proposalId,
        fileName: "x.exe",
        mimeType: "application/x-msdownload",
        size: 100,
      }).success,
    ).toBe(false);
    expect(
      attachmentInputSchema.safeParse({
        proposalId,
        fileName: "x.pdf",
        mimeType: "application/pdf",
        size: MAX_ATTACHMENT_BYTES + 1,
      }).success,
    ).toBe(false);
    expect(
      attachmentInputSchema.safeParse({
        proposalId,
        fileName: "",
        mimeType: "application/pdf",
        size: 1,
      }).success,
    ).toBe(false);
  });
  it("sanitiza o nome de download", () =>
    expect(attachmentDispositionFilename("../../Briefing técnico?.pdf")).toBe(
      "Briefing-tecnico-.pdf",
    ));
});
