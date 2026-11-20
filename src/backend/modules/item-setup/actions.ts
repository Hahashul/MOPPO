"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/backend/auth/permissions";
import type { KindInput, UnitInput } from "./schema";
import {
  createKind,
  createUnit,
  renameUnit,
  setKindActive,
  setUnitActive,
  updateKind,
} from "./service";

export type SetupResult = { ok: true } | { error: string };

const PATH = "/settings/item-setup";

function message(e: unknown) {
  if (e && typeof e === "object" && "issues" in e) {
    const issues = (e as { issues: { message: string }[] }).issues;
    return issues[0]?.message ?? "Invalid input.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

async function run(
  fn: (companyId: string) => Promise<unknown>
): Promise<SetupResult> {
  try {
    const s = await requireRole(["OWNER", "ADMIN"]);
    await fn(s.companyId);
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function createKindAction(input: KindInput) {
  return run((c) => createKind(c, input));
}
export async function updateKindAction(id: string, input: KindInput) {
  return run((c) => updateKind(c, id, input));
}
export async function setKindActiveAction(id: string, isActive: boolean) {
  return run((c) => setKindActive(c, id, isActive));
}
export async function createUnitAction(input: UnitInput) {
  return run((c) => createUnit(c, input));
}
export async function renameUnitAction(id: string, input: UnitInput) {
  return run((c) => renameUnit(c, id, input));
}
export async function setUnitActiveAction(id: string, isActive: boolean) {
  return run((c) => setUnitActive(c, id, isActive));
}