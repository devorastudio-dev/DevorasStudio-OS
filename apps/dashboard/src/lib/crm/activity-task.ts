export const ACTIVITY_TYPES = [
  "call",
  "whatsapp",
  "email",
  "meeting",
  "instagram",
  "note",
  "other",
] as const;
export const activityTypeLabels: Record<
  (typeof ACTIVITY_TYPES)[number],
  string
> = {
  call: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  meeting: "Reunião",
  instagram: "Instagram",
  note: "Anotação",
  other: "Outro",
};
export const taskStatusLabels = {
  pending: "Pendente",
  completed: "Concluída",
  cancelled: "Cancelada",
} as const;
export const OPERATION_TIME_ZONE = "America/Sao_Paulo";
export function formatOperationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: OPERATION_TIME_ZONE,
  }).format(new Date(value));
}
export function classifyDueDate(value: string, now = new Date()) {
  const key = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: OPERATION_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  const due = new Date(value);
  const dueKey = key(due);
  const today = key(now);
  return dueKey < today ? "overdue" : dueKey === today ? "today" : "upcoming";
}
