import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/backend/auth/session";
import { listContacts } from "@/backend/modules/contacts/service";
import { listFields } from "@/backend/modules/custom-fields/service";
import { ContactsFilters } from "@/frontend/features/contacts/ContactsFilters";
import { CONTACT_TYPE_LABELS } from "@/frontend/features/contacts/labels";

type SearchParams = Promise<{
  q?: string;
  type?: string;
  status?: string;
  page?: string;
}>;

function formatValue(v: unknown) {
  if (v === undefined || v === null || v === "") return "–";
  if (v === true) return "Yes";
  if (v === false) return "No";
  return String(v);
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const q = sp.q ?? "";
  const type = sp.type === "customer" || sp.type === "supplier" ? sp.type : "";
  const status = sp.status === "archived" ? "archived" : "active";

  const [result, fields] = await Promise.all([
    listContacts(session.companyId, {
      q,
      type,
      status,
      page: Number(sp.page) || 1,
    }),
    listFields(session.companyId, "CONTACT"),
  ]);

  const columns = fields.filter((f) => f.showInList);

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (status !== "active") params.set("status", status);
    params.set("page", String(page));
    return `/contacts?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} {status === "archived" ? "archived" : "active"}{" "}
            {result.total === 1 ? "contact" : "contacts"}
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Add contact
        </Link>
      </div>

      <ContactsFilters q={q} type={type} status={status} />

      {result.contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {q || type || status === "archived"
            ? "No contacts match your search."
            : "No contacts yet. Add your first customer or supplier."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                {columns.map((c) => (
                  <th key={c.id} className="px-4 py-3 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Credit limit</th>
              </tr>
            </thead>
            <tbody>
              {result.contacts.map((c) => {
                const custom = (c.customFields ?? {}) as Record<string, unknown>;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.code && (
                        <div className="text-xs text-muted-foreground">{c.code}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{CONTACT_TYPE_LABELS[c.type]}</td>
                    <td className="px-4 py-3">{c.phone ?? "–"}</td>
                    {columns.map((col) => (
                      <td key={col.id} className="px-4 py-3">
                        {formatValue(custom[col.key])}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      {c.type === "SUPPLIER"
                        ? "–"
                        : Number(c.creditLimit).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {result.pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {result.page} of {result.pageCount}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link
                href={pageHref(result.page - 1)}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {result.page < result.pageCount && (
              <Link
                href={pageHref(result.page + 1)}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}