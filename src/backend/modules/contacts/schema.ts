import { z } from "zod";

export type ContactFormValues = {
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
  name: string;
  code: string;
  phone: string;
  email: string;
  taxId: string;
  segment: string;
  creditLimit: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

export type ContactResult = { ok: true; id: string } | { errors: string[] };

export const contactSchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]),
  name: z.string().trim().min(1, "Enter a name").max(120, "Name is too long"),
  code: z.string().trim().max(40, "Code is too long").default(""),
  phone: z.string().trim().max(30, "Phone is too long").default(""),
  email: z
    .string()
    .trim()
    .max(120, "Email is too long")
    .refine(
      (v) => v === "" || z.string().email().safeParse(v).success,
      "Enter a valid email"
    )
    .default(""),
  taxId: z.string().trim().max(40, "GSTIN / Tax ID is too long").default(""),
  segment: z.string().trim().max(60, "Group name is too long").default(""),
  creditLimit: z.coerce
    .number()
    .min(0, "Credit limit cannot be negative")
    .max(100000000000, "Credit limit is too large")
    .default(0),
  addressLine: z.string().trim().max(200, "Address is too long").default(""),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(80).default(""),
  pincode: z.string().trim().max(12).default(""),
});