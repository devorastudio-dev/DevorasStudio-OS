import { z } from "zod";

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);
