import { Prisma } from "@prisma/client";
import { db } from "@/backend/database/db";
import { validateCustomValues } from "@/backend/modules/custom-fields/service";
import {
  contactSchema,
  type ContactFormValues,
  type ContactResult,
} from "./schema";

export const PAGE_SIZE = 25;

export type ContactFilters = {
  q?: string;
  type?: string; // "customer" | "supplier" | ""
  status?: string; // "active" | "archived"
  page?: number;
};

export async function listContacts(companyId: string, f: ContactFilters) {
  const where: Prisma.ContactWhereInput = {
    isActive: f.status !== "archived",
  };

  const q = f.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (f.type === "customer") where.type = { in: ["CUSTOMER", "BOTH"] };
  if (f.type === "supplier") where.type = { in: ["SUPPLIER", "BOTH"] };

  const page = Math.max(1, Math.floor(f.page ?? 1));
  const client = db(companyId);

  const [contacts, total] = await Promise.all([
    client.contact.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    client.contact.count({ where }),
  ]);

  return {
    contacts,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getContact(companyId: string, id: string) {
  return db(companyId).contact.findFirst({ where: { id } });
}

type Parsed = ReturnType<typeof contactSchema.parse>;

function toData(p: Parsed) {
  const hasAddress = p.addressLine || p.city || p.state || p.pincode;
  return {
    type: p.type,
    name: p.name,
    code: p.code || null,
    phone: p.phone || null,
    email: p.email ? p.email.toLowerCase() : null,
    taxId: p.taxId || null,
    segment: p.segment || null,
    creditLimit: p.type === "SUPPLIER" ? 0 : p.creditLimit,
    address: hasAddress
      ? {
          line1: p.addressLine,
          city: p.city,
          state: p.state,
          pincode: p.pincode,
        }
      : Prisma.DbNull,
  };
}

function dbError(e: unknown): ContactResult {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return { errors: ["That code is already used by another contact."] };
  }
  throw e;
}

export async function createContact(
  companyId: string,
  input: ContactFormValues,
  custom: Record<string, unknown>
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => i.message) };
  }

  const cv = await validateCustomValues(companyId, "CONTACT", custom);
  if (!cv.ok) return { errors: cv.errors };

  try {
    const created = await db(companyId).contact.create({
      data: {
        companyId,
        ...toData(parsed.data),
        customFields: cv.values as Prisma.InputJsonObject,
      },
    });
    return { ok: true, id: created.id };
  } catch (e) {
    return dbError(e);
  }
}

export async function updateContact(
  companyId: string,
  id: string,
  input: ContactFormValues,
  custom: Record<string, unknown>
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => i.message) };
  }

  const client = db(companyId);
  const existing = await client.contact.findFirst({
    where: { id },
    select: { customFields: true },
  });
  if (!existing) return { errors: ["Contact not found."] };

  // Values of hidden custom fields are kept as they are.
  const cv = await validateCustomValues(
    companyId,
    "CONTACT",
    custom,
    (existing.customFields ?? {}) as Record<string, unknown>
  );
  if (!cv.ok) return { errors: cv.errors };

  try {
    await client.contact.updateMany({
      where: { id },
      data: {
        ...toData(parsed.data),
        customFields: cv.values as Prisma.InputJsonObject,
      },
    });
    return { ok: true, id };
  } catch (e) {
    return dbError(e);
  }
}

// Contacts are archived, never deleted, so old invoices and records stay intact.
export async function setContactActive(
  companyId: string,
  id: string,
  isActive: boolean
) {
  const res = await db(companyId).contact.updateMany({
    where: { id },
    data: { isActive },
  });
  if (res.count === 0) throw new Error("Contact not found.");
}