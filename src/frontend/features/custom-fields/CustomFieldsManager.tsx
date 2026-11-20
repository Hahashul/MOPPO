"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  createFieldAction,
  reorderFieldsAction,
  setFieldActiveAction,
  updateFieldAction,
  type FieldResult,
} from "@/backend/modules/custom-fields/actions";

type Entity = "CONTACT" | "ITEM";
type FieldType = "TEXT" | "NUMBER" | "DATE" | "SELECT" | "BOOLEAN";

export type FieldRow = {
  id: string;
  entity: Entity;
  key: string;
  label: string;
  type: FieldType;
  options: string[];
  isRequired: boolean;
  showInList: boolean;
  isActive: boolean;
};

type FormValues = {
  label: string;
  type: FieldType;
  options: string[];
  isRequired: boolean;
  showInList: boolean;
};

const TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  DATE: "Date",
  SELECT: "Dropdown",
  BOOLEAN: "Yes / No",
};

const ENTITY_LABELS: Record<Entity, string> = {
  CONTACT: "Contacts",
  ITEM: "Items",
};

function parseOptions(text: string) {
  const seen = new Set<string>();
  for (const part of text.split(/[\n,]/)) {
    const s = part.trim();
    if (s) seen.add(s);
  }
  return Array.from(seen);
}

function FieldForm({
  initial,
  pending,
  error,
  onCancel,
  onSave,
}: {
  initial: FieldRow | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (values: FormValues) => void;
}) {
  const editing = initial !== null;
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<FieldType>(initial?.type ?? "TEXT");
  const [optionsText, setOptionsText] = useState(
    (initial?.options ?? []).join("\n")
  );
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? false);
  const [showInList, setShowInList] = useState(initial?.showInList ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      label,
      type,
      options: type === "SELECT" ? parseOptions(optionsText) : [],
      isRequired,
      showInList,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="field-label">Field name</Label>
          <Input
            id="field-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Territory"
            autoFocus
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="field-type">Type</Label>
          <select
            id="field-type"
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
            disabled={editing}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-60"
          >
            {(Object.keys(TYPE_LABELS) as FieldType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {editing && (
            <p className="text-xs text-muted-foreground">
              The type cannot be changed after creation.
            </p>
          )}
        </div>
      </div>

      {type === "SELECT" && (
        <div className="space-y-2">
          <Label htmlFor="field-options">Dropdown choices (one per line)</Label>
          <textarea
            id="field-options"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            rows={4}
            placeholder={"North\nSouth\nEast\nWest"}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
          />
          Required
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showInList}
            onChange={(e) => setShowInList(e.target.checked)}
          />
          Show as a column in lists
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : editing ? "Save changes" : "Add field"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

type Props = { fields: FieldRow[] };

export function CustomFieldsManager({ fields }: Props) {
  // Local copy so clicks feel instant. It re-syncs whenever the server sends new data.
  const [list, setList] = useState<FieldRow[]>(fields);
  useEffect(() => setList(fields), [fields]);

  const [tab, setTab] = useState<Entity>("CONTACT");
  const [editing, setEditing] = useState<string | null>(null); // field id, "new" or null
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mine = list.filter((f) => f.entity === tab);
  const active = mine.filter((f) => f.isActive);
  const hidden = mine.filter((f) => !f.isActive);

  // For slower actions (add, edit): wait for the server, then close the form.
  function run(fn: () => Promise<FieldResult>, done?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if ("error" in res) {
        setError(res.error);
      } else {
        setError(null);
        done?.();
      }
    });
  }

  // For quick actions: update the screen first, save in the background, undo on failure.
  function optimistic(
    apply: (prev: FieldRow[]) => FieldRow[],
    save: () => Promise<FieldResult>
  ) {
    setList(apply);
    setError(null);
    save()
      .then((res) => {
        if ("error" in res) {
          setList(fields);
          setError(res.error);
        }
      })
      .catch(() => {
        setList(fields);
        setError("Could not save. Check your connection and try again.");
      });
  }

  function switchTab(next: Entity) {
    setTab(next);
    setEditing(null);
    setError(null);
  }

  function move(index: number, dir: -1 | 1) {
    const ids = active.map((f) => f.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    optimistic(
      (prev) => {
        const others = prev.filter((f) => !(f.entity === tab && f.isActive));
        const reordered = ids.map((id) => prev.find((f) => f.id === id)!);
        return [...reordered, ...others];
      },
      () => reorderFieldsAction(tab, ids)
    );
  }

  function setActive(id: string, isActive: boolean) {
    optimistic(
      (prev) => prev.map((f) => (f.id === id ? { ...f, isActive } : f)),
      () => setFieldActiveAction(id, isActive)
    );
  }

  function create(values: FormValues) {
    run(
      () => createFieldAction({ entity: tab, ...values }),
      () => setEditing(null)
    );
  }

  function update(id: string, values: FormValues) {
    run(
      () =>
        updateFieldAction(id, {
          label: values.label,
          options: values.options,
          isRequired: values.isRequired,
          showInList: values.showInList,
        }),
      () => setEditing(null)
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b">
        {(Object.keys(ENTITY_LABELS) as Entity[]).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => switchTab(e)}
            className={
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium " +
              (tab === e
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {ENTITY_LABELS[e]}
          </button>
        ))}
      </div>

      {error && editing === null && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="space-y-3">
        {active.length === 0 && editing !== "new" && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No custom fields for {ENTITY_LABELS[tab].toLowerCase()} yet.
          </p>
        )}

        {active.map((f, i) =>
          editing === f.id ? (
            <FieldForm
              key={f.id}
              initial={f}
              pending={pending}
              error={error}
              onCancel={() => {
                setEditing(null);
                setError(null);
              }}
              onSave={(v) => update(f.id, v)}
            />
          ) : (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <p className="font-medium">{f.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {TYPE_LABELS[f.type]}
                  {f.type === "SELECT" && ` · ${f.options.length} choices`}
                  {f.isRequired && " · Required"}
                  {f.showInList && " · In list"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Move up"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={i === active.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move down"
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setEditing(f.id);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActive(f.id, false)}
                >
                  Hide
                </Button>
              </div>
            </div>
          )
        )}

        {editing === "new" ? (
          <FieldForm
            initial={null}
            pending={pending}
            error={error}
            onCancel={() => {
              setEditing(null);
              setError(null);
            }}
            onSave={create}
          />
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setEditing("new");
            }}
          >
            + Add field
          </Button>
        )}
      </div>

      {hidden.length > 0 && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Hidden fields ({hidden.length})
          </summary>
          <div className="mt-3 space-y-2">
            {hidden.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-muted-foreground">
                  {f.label} · {TYPE_LABELS[f.type]}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActive(f.id, true)}
                >
                  Show
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}