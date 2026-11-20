"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/backend/auth/permissions";
import { entitySchema } from "./schema";
import type { CreateFieldInput, UpdateFieldInput } from "./schema";
import {
  createField,
  reorderFields,
  setFieldActive,
  updateField,
} from "./service";

export type FieldResult = { ok: true } | { error: string };

const PATH = "/settings/custom-fields";

function message(e: unknown) {
  if (e && typeof e === "object" && "issues" in e) {
    const issues = (e as { issues: { message: string }[] }).issues;
    return issues[0]?.message ?? "Invalid input.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

export async function createFieldAction(
  input: CreateFieldInput
): Promise<FieldResult> {
  try {
    const s = await requireRole(["OWNER", "ADMIN"]);
    await createField(s.companyId, input);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function updateFieldAction(
  id: string,
  input: UpdateFieldInput
): Promise<FieldResult> {
  try {
    const s = await requireRole(["OWNER", "ADMIN"]);
    await updateField(s.companyId, id, input);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function setFieldActiveAction(
  id: string,
  isActive: boolean
): Promise<FieldResult> {
  try {
    const s = await requireRole(["OWNER", "ADMIN"]);
    await setFieldActive(s.companyId, id, isActive);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function reorderFieldsAction(
  entity: string,
  orderedIds: string[]
): Promise<FieldResult> {
  try {
    const s = await requireRole(["OWNER", "ADMIN"]);
    await reorderFields(s.companyId, entitySchema.parse(entity), orderedIds);
    return { ok: true };
  } catch (e) {
    return { error: message(e) };
  }
}