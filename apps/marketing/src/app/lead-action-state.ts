export type LeadActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialLeadState: LeadActionState = {
  status: "idle",
  message: "",
};
