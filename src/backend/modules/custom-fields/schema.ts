import { z } from "zod";

export const entitySchema = z.enum(["CONTACT", "ITEM"]);
export const fieldTypeSchema = z.enum([
  "TEXT",
  "NUMBER",
  "DATE",
  "SELECT",
  "BOOLEAN",
]);

const optionsSchema = z
  .array(z.string().trim().min(1, "Option cannot be empty").max(60))
  .max(50, "Too many options")
  .optional();

export const createFieldSchema = z
  .object({
    entity: entitySchema,
    label: z.string().trim().min(1, "Enter a name").max(60, "Name is too long"),
    type: fieldTypeSchema,
    options: optionsSchema,
    isRequired: z.boolean().default(false),
    showInList: z.boolean().default(false),
  })
  .refine((v) => v.type !== "SELECT" || (v.options && v.options.length > 0), {
    message: "Add at least one option for a dropdown",
    path: ["options"],
  });

// The type and the internal key can never change after creation (protects saved data).
export const updateFieldSchema = z.object({
  label: z.string().trim().min(1, "Enter a name").max(60, "Name is too long"),
  options: optionsSchema,
  isRequired: z.boolean(),
  showInList: z.boolean(),
});

export type CreateFieldInput = z.input<typeof createFieldSchema>;
export type UpdateFieldInput = z.input<typeof updateFieldSchema>;