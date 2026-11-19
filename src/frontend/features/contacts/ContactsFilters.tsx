"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/frontend/components/ui/input";

type Props = { q: string; type: string; status: string };

const selectClass = "h-9 rounded-md border bg-transparent px-3 text-sm";

export function ContactsFilters({ q, type, status }: Props) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const first = useRef(true);

  function go(next: { q?: string; type?: string; status?: string }) {
    const nq = next.q ?? text;
    const nt = next.type ?? type;
    const ns = next.status ?? status;
    const params = new URLSearchParams();
    if (nq) params.set("q", nq);
    if (nt) params.set("type", nt);
    if (ns && ns !== "active") params.set("status", ns);
    const s = params.toString();
    router.replace(s ? `/contacts?${s}` : "/contacts");
  }

  // Search as you type, after a short pause.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => go({ q: text }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search name, phone, email or code"
        className="w-full sm:w-72"
      />
      <select
        value={type}
        onChange={(e) => go({ type: e.target.value })}
        className={selectClass}
      >
        <option value="">All contacts</option>
        <option value="customer">Customers</option>
        <option value="supplier">Suppliers</option>
      </select>
      <select
        value={status}
        onChange={(e) => go({ status: e.target.value })}
        className={selectClass}
      >
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  );
}