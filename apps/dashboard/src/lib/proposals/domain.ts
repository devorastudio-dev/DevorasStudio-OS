export const SERVICE_UNITS = [
  "project",
  "hour",
  "month",
  "unit",
  "custom",
] as const;
export type ServiceUnit = (typeof SERVICE_UNITS)[number];
export const unitLabels: Record<ServiceUnit, string> = {
  project: "Projeto",
  hour: "Hora",
  month: "Mês",
  unit: "Unidade",
  custom: "Personalizada",
};
export const proposalStatusLabels = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
  cancelled: "Cancelada",
} as const;

export function formatMoney(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function isDraft(status: string) {
  return status === "draft";
}
