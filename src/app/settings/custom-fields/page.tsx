import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";
import { listAllFields } from "@/backend/modules/custom-fields/service";
import {
  CustomFieldsManager,
  type FieldRow,
} from "@/frontend/features/custom-fields/CustomFieldsManager";

export default async function CustomFieldsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "STAFF") redirect("/dashboard");

  const raw = await listAllFields(session.companyId);

  const fields: FieldRow[] = raw.map((f) => ({
    id: f.id,
    entity: f.entity,
    key: f.key,
    label: f.label,
    type: f.type,
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
    isRequired: f.isRequired,
    showInList: f.showInList,
    isActive: f.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Custom fields</h1>
        <p className="text-sm text-muted-foreground">
          Add your own boxes to contact and item forms. Hiding a field keeps
          its saved data safe.
        </p>
      </div>
      <CustomFieldsManager fields={fields} />
    </div>
  );
}