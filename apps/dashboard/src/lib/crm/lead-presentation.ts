export const leadEmailText = (email: string | null, empty = "Não informado") =>
  email ?? empty;

export const leadEmailHref = (email: string | null) =>
  email ? `mailto:${email}` : null;
