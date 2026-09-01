export const PROPOSAL_SECTION_TYPES = [
  "introduction",
  "objective",
  "scope",
  "deliverables",
  "technologies",
  "timeline",
  "commercial_terms",
  "notes",
  "closing",
  "custom",
] as const;
export type ProposalSectionType = (typeof PROPOSAL_SECTION_TYPES)[number];

export const sectionTypeLabels: Record<ProposalSectionType, string> = {
  introduction: "Apresentação",
  objective: "Objetivo",
  scope: "Escopo",
  deliverables: "Entregáveis",
  technologies: "Tecnologias",
  timeline: "Prazo estimado",
  commercial_terms: "Condições comerciais",
  notes: "Observações",
  closing: "Encerramento",
  custom: "Personalizada",
};

export type ProposalDocument = {
  proposal: {
    number: string;
    title: string;
    createdAt: string;
    validUntil: string | null;
    subtotal: number;
    discount: number;
    total: number;
  };
  organization: {
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    city: string | null;
    logoPath: string | null;
  };
  client: { name: string };
  sections: Array<{
    id: string;
    title: string;
    content: string;
    type: ProposalSectionType;
    visible: boolean;
    position: number;
  }>;
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
};

export const SUPPORTED_PROPOSAL_TOKENS = [
  "proposal.number",
  "proposal.title",
  "proposal.valid_until",
  "proposal.total",
  "client.name",
  "organization.name",
] as const;

export function resolveProposalTokens(
  text: string,
  document: ProposalDocument,
) {
  const values: Record<(typeof SUPPORTED_PROPOSAL_TOKENS)[number], string> = {
    "proposal.number": document.proposal.number,
    "proposal.title": document.proposal.title,
    "proposal.valid_until": document.proposal.validUntil
      ? new Date(`${document.proposal.validUntil}T12:00:00`).toLocaleDateString(
          "pt-BR",
        )
      : "",
    "proposal.total": new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(document.proposal.total),
    "client.name": document.client.name,
    "organization.name": document.organization.name,
  };
  const unknown: string[] = [];
  const value = text.replace(
    /\{\{\s*([a-z_.]+)\s*\}\}/g,
    (token, key: string) => {
      if (Object.hasOwn(values, key)) return values[key as keyof typeof values];
      unknown.push(key);
      return token;
    },
  );
  return { value, unknown: [...new Set(unknown)] };
}
