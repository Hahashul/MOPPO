import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";
import { listFields } from "@/backend/modules/custom-fields/service";
import { ContactForm } from "@/frontend/features/contacts/ContactForm";
import type { CustomFieldDef } from "@/frontend/features/custom-fields/CustomFieldInputs";

export default async function NewContactPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const fields = await listFields(session.companyId, "CONTACT");
  const defs: CustomFieldDef[] = fields.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
    isRequired: f.isRequired,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add contact</h1>
      <ContactForm
        mode="create"
        initial={{
          type: "CUSTOMER",
          name: "",
          code: "",
          phone: "",
          email: "",
          taxId: "",
          segment: "",
          creditLimit: "0",
          addressLine: "",
          city: "",
          state: "",
          pincode: "",
        }}
        initialCustom={{}}
        customFields={defs}
      />
    </div>
  );
}