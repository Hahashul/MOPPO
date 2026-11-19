import { notFound, redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";
import { getContact } from "@/backend/modules/contacts/service";
import { listFields } from "@/backend/modules/custom-fields/service";
import { ContactForm } from "@/frontend/features/contacts/ContactForm";
import type {
  CustomFieldDef,
  CustomValues,
} from "@/frontend/features/custom-fields/CustomFieldInputs";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const [contact, fields] = await Promise.all([
    getContact(session.companyId, id),
    listFields(session.companyId, "CONTACT"),
  ]);
  if (!contact) notFound();

  const defs: CustomFieldDef[] = fields.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    options: Array.isArray(f.options) ? (f.options as string[]) : [],
    isRequired: f.isRequired,
  }));

  const saved = (contact.customFields ?? {}) as Record<string, unknown>;
  const initialCustom: CustomValues = {};
  for (const f of defs) {
    const raw = saved[f.key];
    initialCustom[f.key] =
      f.type === "BOOLEAN"
        ? raw === true
        : raw === undefined || raw === null
          ? ""
          : String(raw);
  }

  const addr = (contact.address ?? {}) as {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{contact.name}</h1>
        {!contact.isActive && (
          <p className="text-sm text-muted-foreground">This contact is archived.</p>
        )}
      </div>
      <ContactForm
        mode="edit"
        contactId={contact.id}
        isActive={contact.isActive}
        canArchive={session.role !== "STAFF"}
        initial={{
          type: contact.type,
          name: contact.name,
          code: contact.code ?? "",
          phone: contact.phone ?? "",
          email: contact.email ?? "",
          taxId: contact.taxId ?? "",
          segment: contact.segment ?? "",
          creditLimit: String(contact.creditLimit),
          addressLine: addr.line1 ?? "",
          city: addr.city ?? "",
          state: addr.state ?? "",
          pincode: addr.pincode ?? "",
        }}
        initialCustom={initialCustom}
        customFields={defs}
      />
    </div>
  );
}