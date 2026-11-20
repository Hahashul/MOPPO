import { z } from "zod";

export const kindSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60, "Name is too long."),
  tracksStock: z.boolean(),
  canBuy: z.boolean(),
  canSell: z.boolean(),
  canBeInBom: z.boolean(),
});
export type KindInput = z.infer<typeof kindSchema>;

export const unitSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(20, "Name is too long."),
});
export type UnitInput = z.infer<typeof unitSchema>;