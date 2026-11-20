import { db } from "@/backend/database/db";
import {
  kindSchema,
  unitSchema,
  type KindInput,
  type UnitInput,
} from "./schema";

// ---------- Item types (ItemKind) ----------

export async function listKinds(
  companyId: string,
  opts: { includeHidden?: boolean } = {}
) {
  return db(companyId).itemKind.findMany({
    where: opts.includeHidden ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createKind(companyId: string, input: KindInput) {
  const data = kindSchema.parse(input);
  const client = db(companyId);

  const existing = await client.itemKind.findMany({
    select: { name: true, sortOrder: true },
  });
  if (existing.some((k) => k.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error("An item type with this name already exists.");
  }
  const sortOrder = existing.reduce((m, k) => Math.max(m, k.sortOrder), -1) + 1;

  return client.itemKind.create({ data: { companyId, ...data, sortOrder } });
}

// Rename and flags. Items point to the type by ID, so renaming is safe.
export async function updateKind(
  companyId: string,
  id: string,
  input: KindInput
) {
  const data = kindSchema.parse(input);
  const client = db(companyId);

  const others = await client.itemKind.findMany({
    where: { NOT: { id } },
    select: { name: true },
  });
  if (others.some((k) => k.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error("An item type with this name already exists.");
  }

  const res = await client.itemKind.updateMany({ where: { id }, data });
  if (res.count === 0) throw new Error("Item type not found.");
}

// Hide or show. Never deleted in V1, so old items keep their type.
export async function setKindActive(
  companyId: string,
  id: string,
  isActive: boolean
) {
  const res = await db(companyId).itemKind.updateMany({
    where: { id },
    data: { isActive },
  });
  if (res.count === 0) throw new Error("Item type not found.");
}

// ---------- Units ----------

export async function listUnits(
  companyId: string,
  opts: { includeHidden?: boolean } = {}
) {
  return db(companyId).unit.findMany({
    where: opts.includeHidden ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createUnit(companyId: string, input: UnitInput) {
  const data = unitSchema.parse(input);
  const client = db(companyId);

  const existing = await client.unit.findMany({
    select: { name: true, sortOrder: true },
  });
  if (existing.some((u) => u.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error("This unit already exists.");
  }
  const sortOrder = existing.reduce((m, u) => Math.max(m, u.sortOrder), -1) + 1;

  return client.unit.create({ data: { companyId, name: data.name, sortOrder } });
}

// Rename a unit. Items store the unit name as text, so every item using the
// old name is updated in the same transaction.
export async function renameUnit(
  companyId: string,
  id: string,
  input: UnitInput
) {
  const data = unitSchema.parse(input);
  const client = db(companyId);

  const unit = await client.unit.findFirst({ where: { id } });
  if (!unit) throw new Error("Unit not found.");
  if (unit.name === data.name) return;

  const others = await client.unit.findMany({
    where: { NOT: { id } },
    select: { name: true },
  });
  if (others.some((u) => u.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error("This unit already exists.");
  }

  await client.$transaction([
    client.unit.updateMany({ where: { id }, data: { name: data.name } }),
    client.item.updateMany({
      where: { unit: unit.name },
      data: { unit: data.name },
    }),
  ]);
}

// Hide or show. Never deleted in V1, so old items keep their unit.
export async function setUnitActive(
  companyId: string,
  id: string,
  isActive: boolean
) {
  const res = await db(companyId).unit.updateMany({
    where: { id },
    data: { isActive },
  });
  if (res.count === 0) throw new Error("Unit not found.");
}