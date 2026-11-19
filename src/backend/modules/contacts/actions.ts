"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireSession } from "@/backend/auth/permissions";
import type { ContactFormValues, ContactResult } from "./schema";
import { createContact, setContactActive, updateContact } from "./service";

function fail(e: unknown): ContactResult {
  return {
    errors: [e instanceof Error ? e.message : "Something went wrong."],
  };
}

export async function createContactAction(
  values: ContactFormValues,
  custom: Record<string, unknown>
): Promise<ContactResult> {
  try {
    const s = await requireSession();
    const res = await createContact(s.companyId, values, custom);
    if ("ok" in res) revalidatePath("/contacts");
    return res;
  } catch (e) {
    return fail(e);
  }
}

export async function updateContactAction(
  id: string,
  values: ContactFormValues,
  custom: Record<string, unknown>
): Promise<ContactResult> {
  try {
    const s = await requireSession();
    const res = await updateContact(s.companyId, id, values, custom);
    if ("ok" in res) revalidatePath("/contacts");
    return res;
  } catch (e) {
    return fail(e);
  }
}

export async function setContactActiveAction(
  id: string,
  isActive: boolean
): Promise<ContactResult> {
  try {
    const s = await requireRole(["OWNER", "ADMIN"]);
    await setContactActive(s.companyId, id, isActive);
    revalidatePath("/contacts");
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}