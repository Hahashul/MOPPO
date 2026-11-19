import { db, prisma } from "@/backend/database/db";
import { getTemplate } from "@/backend/templates";
import { listAllFields } from "./service";

type Existing = { entity: string; key: string };

function findMissing(templateId: string, existing: Existing[]) {
  const tpl = getTemplate(templateId);
  const have = new Set(existing.map((f) => `${f.entity}:${f.key}`));
  return tpl.customFields.filter((f) => !have.has(`${f.entity}:${f.key}`));
}

// Everything the settings page needs, fetched in parallel (2 queries).
export async function getCustomFieldsPageData(companyId: string) {
  const [company, fields] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { template: true },
    }),
    listAllFields(companyId),
  ]);
  const missing = findMissing(company?.template ?? "custom", fields);
  return { fields, missingCount: missing.length };
}

// Adds the missing template fields. Never touches fields that already exist.
export async function applyTemplateFields(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { template: true },
  });
  const existing = await listAllFields(companyId);
  const missing = findMissing(company?.template ?? "custom", existing);
  if (missing.length === 0) return 0;

  const next: Record<string, number> = {};
  for (const f of existing) {
    next[f.entity] = Math.max(next[f.entity] ?? 0, f.sortOrder + 1);
  }

  await db(companyId).customFieldDefinition.createMany({
    data: missing.map((f) => {
      const sortOrder = next[f.entity] ?? 0;
      next[f.entity] = sortOrder + 1;
      return {
        companyId,
        entity: f.entity,
        key: f.key,
        label: f.label,
        type: f.type,
        options: f.options,
        showInList: f.showInList ?? false,
        sortOrder,
      };
    }),
  });

  return missing.length;
}