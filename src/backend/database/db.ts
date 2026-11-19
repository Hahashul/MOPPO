import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

const TENANT_MODELS = [
  "Contact",
  "Item",
  "Warehouse",
  "StockMovement",
  "AuditLog",
  "Membership",
  "CustomFieldDefinition",
];

/**
 * Tenant-scoped access. Always use db(companyId) in app code, never raw `prisma`,
 * so a query can never leak another company's data.
 */
export function db(companyId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.includes(model)) return query(args);
          const a = args as any;
          if (operation === "create") {
            a.data = { ...a.data, companyId };
          } else if (operation === "createMany") {
            a.data = (Array.isArray(a.data) ? a.data : [a.data]).map(
              (d: any) => ({ ...d, companyId })
            );
          } else {
            a.where = { ...(a.where ?? {}), companyId };
          }
          return query(a);
        },
      },
    },
  });
}