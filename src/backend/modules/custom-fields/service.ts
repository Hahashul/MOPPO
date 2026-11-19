import { Prisma, type CustomFieldEntity } from "@prisma/client";
import { db, prisma } from "@/backend/database/db";
import {
  createFieldSchema,
  updateFieldSchema,
  type CreateFieldInput,
  type UpdateFieldInput,
} from "./schema";

function makeKey(label: string) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[a-z]/.test(base) ? base : `f_${base || "field"}`;
}

export async function listFields(
  companyId: string,
  entity: CustomFieldEntity,
  opts: { includeHidden?: boolean } = {}
) {
  return db(companyId).customFieldDefinition.findMany({
    where: { entity, ...(opts.includeHidden ? {} : { isActive: true }) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

// Both entities, hidden included, in one query (used by the settings page).
export async function listAllFields(companyId: string) {
  return db(companyId).customFieldDefinition.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createField(companyId: string, input: CreateFieldInput) {
  const data = createFieldSchema.parse(input);
  const client = db(companyId);

  const existing = await client.customFieldDefinition.findMany({
    where: { entity: data.entity },
    select: { key: true, sortOrder: true },
  });
  const taken = new Set(existing.map((f) => f.key));

  const base = makeKey(data.label);
  let key = base;
  let n = 2;
  while (taken.has(key)) key = `${base}_${n++}`;

  const sortOrder = existing.reduce((m, f) => Math.max(m, f.sortOrder), -1) + 1;

  return client.customFieldDefinition.create({
    data: {
      companyId,
      entity: data.entity,
      key,
      label: data.label,
      type: data.type,
      options: data.type === "SELECT" ? data.options : undefined,
      isRequired: data.isRequired,
      showInList: data.showInList,
      sortOrder,
    },
  });
}

export async function updateField(
  companyId: string,
  id: string,
  input: UpdateFieldInput
) {
  const data = updateFieldSchema.parse(input);
  const client = db(companyId);

  const field = await client.customFieldDefinition.findFirst({ where: { id } });
  if (!field) throw new Error("Field not found.");
  if (field.type === "SELECT" && (!data.options || data.options.length === 0)) {
    throw new Error("Add at least one option for a dropdown.");
  }

  await client.customFieldDefinition.updateMany({
    where: { id },
    data: {
      label: data.label,
      options: field.type === "SELECT" ? data.options : undefined,
      isRequired: data.isRequired,
      showInList: data.showInList,
    },
  });
}

// Hide or show. Fields are never deleted, so saved values are never lost.
export async function setFieldActive(
  companyId: string,
  id: string,
  isActive: boolean
) {
  const res = await db(companyId).customFieldDefinition.updateMany({
    where: { id },
    data: { isActive },
  });
  if (res.count === 0) throw new Error("Field not found.");
}

// One database call, scoped to this company and entity.
export async function reorderFields(
  companyId: string,
  entity: CustomFieldEntity,
  orderedIds: string[]
) {
  if (orderedIds.length === 0) return;
  const rows = Prisma.join(
    orderedIds.map((id, i) => Prisma.sql`(${id}::text, ${i}::int)`)
  );
  await prisma.$executeRaw`
    UPDATE "CustomFieldDefinition" AS f
    SET "sortOrder" = v.pos
    FROM (VALUES ${rows}) AS v(id, pos)
    WHERE f.id = v.id
      AND f."companyId" = ${companyId}
      AND f.entity = ${entity}::"CustomFieldEntity"
  `;
}

export type CustomValues = Record<string, string | number | boolean | null>;

/**
 * Checks submitted custom values against this company's active field definitions.
 * `existing` is the record's current values: values of hidden fields are kept untouched.
 * Returns the merged values to save, or a list of error messages.
 */
export async function validateCustomValues(
  companyId: string,
  entity: CustomFieldEntity,
  input: Record<string, unknown>,
  existing: Record<string, unknown> = {}
): Promise<
  { ok: true; values: Record<string, unknown> } | { ok: false; errors: string[] }
> {
  const fields = await listFields(companyId, entity);
  const values: Record<string, unknown> = { ...existing };
  const errors: string[] = [];

  for (const f of fields) {
    const raw = input[f.key];
    const empty =
      raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");

    if (f.type === "BOOLEAN") {
      values[f.key] = raw === true || raw === "true" || raw === "on";
      continue;
    }

    if (empty) {
      if (f.isRequired) errors.push(`${f.label} is required.`);
      delete values[f.key];
      continue;
    }

    if (f.type === "TEXT") {
      const s = String(raw).trim();
      if (s.length > 500) errors.push(`${f.label} is too long.`);
      else values[f.key] = s;
    } else if (f.type === "NUMBER") {
      const n = Number(raw);
      if (!Number.isFinite(n)) errors.push(`${f.label} must be a number.`);
      else values[f.key] = n;
    } else if (f.type === "DATE") {
      const s = String(raw);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) {
        errors.push(`${f.label} must be a valid date.`);
      } else values[f.key] = s;
    } else if (f.type === "SELECT") {
      const opts = Array.isArray(f.options) ? (f.options as string[]) : [];
      const s = String(raw);
      if (!opts.includes(s)) errors.push(`${f.label} has an invalid choice.`);
      else values[f.key] = s;
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, values };
}