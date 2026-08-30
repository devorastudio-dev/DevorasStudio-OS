export const CRM_SOURCES = [
  "website",
  "99freelas",
  "instagram",
  "pinterest",
  "tiktok",
  "whatsapp",
  "google_maps",
  "referral",
  "outbound",
  "other",
] as const;
export const CRM_TRIAGE = [
  "new",
  "in_review",
  "qualified",
  "disqualified",
] as const;

export const sourceLabels: Record<(typeof CRM_SOURCES)[number], string> = {
  website: "Site / landing",
  "99freelas": "99Freelas",
  instagram: "Instagram",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  google_maps: "Google Maps",
  referral: "Indicação",
  outbound: "Prospecção ativa",
  other: "Outro",
};
export const triageLabels: Record<(typeof CRM_TRIAGE)[number], string> = {
  new: "Novo",
  in_review: "Em triagem",
  qualified: "Qualificado",
  disqualified: "Desqualificado",
};
