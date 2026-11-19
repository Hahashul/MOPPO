"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createContactAction,
  setContactActiveAction,
  updateContactAction,
} from "@/backend/modules/contacts/actions";
import type { ContactFormValues } from "@/backend/modules/contacts/schema";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  CustomFieldInputs,
  type CustomFieldDef,
  type CustomValues,
} from "@/frontend/features/custom-fields/CustomFieldInputs";
import { CONTACT_TYPE_LABELS } from "./labels";

type Props = {
  mode: "create" | "edit";
  contactId?: string;
  isActive?: boolean;
  canArchive?: boolean;
  initial: ContactFormValues;
  initialCustom: CustomValues;
  customFields: CustomFieldDef[];
};

export function ContactForm({
  mode,
  contactId,
  isActive = true,
  canArchive = false,
  initial,
  initialCustom,
  customFields,
}: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ContactFormValues>(initial);
  const [custom, setCustom] = useState<CustomValues>(initialCustom);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createContactAction(values, custom)
          : await updateContactAction(contactId!, values, custom);
      if ("errors" in res) {
        setErrors(res.errors);
      } else {
        router.push("/contacts");
      }
    });
  }

  function toggleArchive() {
    startTransition(async () => {
      const res = await setContactActiveAction(contactId!, !isActive);
      if ("errors" in res) setErrors(res.errors);
      else router.push("/contacts");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="font-medium">Basic details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={values.type}
              onChange={(e) =>
                set("type", e.target.value as ContactFormValues["type"])
              }
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              {Object.entries(CONTACT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">GSTIN / Tax ID</Label>
            <Input
              id="taxId"
              value={values.taxId}
              onChange={(e) => set("taxId", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code (optional)</Label>
            <Input
              id="code"
              value={values.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="e.g. DLR-001"
            />
          </div>
          {values.type !== "SUPPLIER" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="segment">Customer group (optional)</Label>
                <Input
                  id="segment"
                  value={values.segment}
                  onChange={(e) => set("segment", e.target.value)}
                  placeholder="e.g. Dealer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  min="0"
                  step="any"
                  value={values.creditLimit}
                  onChange={(e) => set("creditLimit", e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-5">
        <h2 className="font-medium">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressLine">Street address</Label>
            <Input
              id="addressLine"
              value={values.addressLine}
              onChange={(e) => set("addressLine", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={values.pincode}
              onChange={(e) => set("pincode", e.target.value)}
            />
          </div>
        </div>
      </section>

      {customFields.length > 0 && (
        <section className="space-y-4 rounded-xl border p-5">
          <h2 className="font-medium">Extra details</h2>
          <CustomFieldInputs
            fields={customFields}
            values={custom}
            onChange={(key, value) => setCustom((c) => ({ ...c, [key]: value }))}
          />
        </section>
      )}

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-red-500">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : mode === "create" ? "Add contact" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push("/contacts")}
          >
            Cancel
          </Button>
        </div>
        {mode === "edit" && canArchive && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={toggleArchive}
          >
            {isActive ? "Archive contact" : "Restore contact"}
          </Button>
        )}
      </div>
    </form>
  );
}