export const LOSS_REASONS = [
  "price",
  "no_response",
  "no_interest",
  "timing",
  "competitor",
  "unmet_need",
  "other",
] as const;

export const lossReasonLabels: Record<(typeof LOSS_REASONS)[number], string> = {
  price: "Preço",
  no_response: "Sem retorno",
  no_interest: "Sem interesse",
  timing: "Momento inadequado",
  competitor: "Escolheu concorrente",
  unmet_need: "Necessidade não atendida",
  other: "Outro",
};

export const categoryLabels = {
  open: "Aberta",
  won: "Ganha",
  lost: "Perdida",
} as const;

export function formatEstimatedValue(value: number | null) {
  if (value === null) return "Valor não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
