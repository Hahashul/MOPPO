"use client";

import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

export type CustomFieldDef = {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "BOOLEAN";
  options: string[];
  isRequired: boolean;
};

export type CustomValues = Record<string, string | boolean>;

type Props = {
  fields: CustomFieldDef[];
  values: CustomValues;
  onChange: (key: string, value: string | boolean) => void;
};

export function CustomFieldInputs({ fields, values, onChange }: Props) {
  if (fields.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `cf-${f.key}`;
        const v = values[f.key];

        if (f.type === "BOOLEAN") {
          return (
            <label key={f.key} className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={v === true}
                onChange={(e) => onChange(f.key, e.target.checked)}
              />
              {f.label}
            </label>
          );
        }

        const text = typeof v === "string" ? v : "";

        return (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={id}>
              {f.label}
              {f.isRequired && <span className="text-red-500"> *</span>}
            </Label>
            {f.type === "SELECT" ? (
              <select
                id={id}
                value={text}
                onChange={(e) => onChange(f.key, e.target.value)}
                required={f.isRequired}
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">Select...</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={id}
                type={
                  f.type === "NUMBER" ? "number" : f.type === "DATE" ? "date" : "text"
                }
                step={f.type === "NUMBER" ? "any" : undefined}
                value={text}
                onChange={(e) => onChange(f.key, e.target.value)}
                required={f.isRequired}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}