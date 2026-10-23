"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { saveResourceAction, saveVenueAction } from "../actions";

export type Row = { id: string; name: string; amount: number; active: boolean; location: string; future: number; inUse: number };
const COPY = {
  venue: { title: "Venues", one: "venue", amountLabel: "Capacity", amountKey: "capacity", nameErr: "Enter a name for the venue.", amountErr: "Enter the capacity as a whole number, at least 1." },
  resource: { title: "Resources", one: "resource", amountLabel: "Total", amountKey: "total", nameErr: "Enter a name for the resource.", amountErr: "Enter the total as a whole number, at least 1." },
} as const;
const cell = "flex justify-between gap-3 px-3 py-2 before:font-semibold before:content-[attr(data-label)] sm:table-cell sm:before:hidden";

export function CatalogSection({ kind, rows }: { kind: "venue" | "resource"; rows: Row[] }) {
  const c = COPY[kind];
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [saved, setSaved] = useState(false);
  const savedRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (saved) savedRef.current?.focus(); }, [saved]);
  const open = (r: Row | "new") => { setSaved(false); setEditing(r); };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-heading font-semibold">{c.title}</h2>
      {saved && <div ref={savedRef} tabIndex={-1}><Alert variant="success" title={kind === "venue" ? "Venue saved" : "Resource saved"} /></div>}
      {rows.length === 0 && !editing ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-heading font-semibold">No {c.one}s yet</p>
          <p className="text-body text-muted">{kind === "venue" ? "Add the first venue so coordinators can book it." : "Add the first resource so coordinators can request it."}</p>
          <Button onClick={() => open("new")}>Add {c.one}</Button>
        </div>
      ) : (
        <>
          <table className="block w-full text-left sm:table">
            <caption className="pb-2 text-left text-label text-muted">{kind === "venue" ? "Venues coordinators can book" : "Resources coordinators can request"}</caption>
            <thead className="sr-only sm:table-header-group">
              <tr>
                <th scope="col" className="p-2">Name</th>
                <th scope="col" className="p-2">{c.amountLabel}</th>
                {kind === "venue" ? <th scope="col" className="p-2">In use</th> : <><th scope="col" className="p-2">Free today</th><th scope="col" className="p-2">In use</th></>}
                <th scope="col" className="p-2">Edit</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {rows.map((r) => (
                <tr key={r.id} className="mb-3 block rounded-control border border-border-card sm:mb-0 sm:table-row sm:rounded-none sm:border-0 sm:border-t">
                  <th scope="row" className="block px-3 py-2 font-semibold sm:table-cell">{r.name}</th>
                  <td data-label={c.amountLabel} className={cell}>{r.amount}</td>
                  {kind === "venue" ? (
                    <td data-label="In use" className={cell}>
                      <span className="inline-flex items-center gap-1">{r.active ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}{r.active ? "Yes" : "No"}</span>
                    </td>
                  ) : (
                    <>
                      <td data-label="Free today" className={cell}>{Math.max(r.amount - r.inUse, 0)}</td>
                      <td data-label="In use" className={cell}>{r.inUse}</td>
                    </>
                  )}
                  <td className="px-3 py-2"><Button variant="secondary" onClick={() => open(r)} aria-label={`Edit ${r.name}`}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!editing && <div><Button variant="secondary" onClick={() => open("new")}>Add {c.one}</Button></div>}
        </>
      )}
      {editing && <CatalogForm key={editing === "new" ? "new" : editing.id} kind={kind} row={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setSaved(true); }} />}
    </section>
  );
}

function CatalogForm({ kind, row, onClose, onSaved }: { kind: "venue" | "resource"; row: Row | null; onClose: () => void; onSaved: () => void }) {
  const c = COPY[kind];
  const [name, setName] = useState(row?.name ?? "");
  const [amount, setAmount] = useState(row ? String(row.amount) : "");
  const [location, setLocation] = useState(row?.location ?? "");
  const [active, setActive] = useState(row?.active ?? true);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string>();
  const [pending, start] = useTransition();
  const errRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (formErr || Object.keys(errs).length) errRef.current?.focus(); }, [formErr, errs]);

  const checkName = (v: string) => (v.trim() && v.trim().length <= 80 ? "" : c.nameErr);
  const checkAmount = (v: string) => (/^\d+$/.test(v.trim()) && Number(v) >= 1 ? "" : c.amountErr);
  const set = (k: string, m: string) => setErrs((e) => { const n = { ...e }; if (m) n[k] = m; else delete n[k]; return n; });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (checkName(name)) found.name = checkName(name);
    if (checkAmount(amount)) found[c.amountKey] = checkAmount(amount);
    setErrs(found); setFormErr(undefined);
    if (Object.keys(found).length) return;
    start(async () => {
      const r = kind === "venue"
        ? await saveVenueAction({ id: row?.id, name, capacity: amount, location, active })
        : await saveResourceAction({ id: row?.id, name, total: amount, active });
      if (r.ok) return onSaved();
      if (r.fieldErrors) setErrs(r.fieldErrors);
      else if (kind === "resource" && r.error?.includes("already reserved")) setErrs({ total: r.error });
      else setFormErr(r.error ?? "Something went wrong on our side. Please try again in a moment.");
    });
  }

  const retiring = kind === "venue" && !!row && row.active && !active && row.future > 0;
  return (
    <Card>
      <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-4" aria-label={`${row ? "Edit" : "Add"} ${c.one}`}>
        <h3 className="text-heading font-semibold">{row ? `Edit ${row.name}` : `Add ${c.one}`}</h3>
        {(formErr || Object.keys(errs).length > 0) && (
          <div ref={errRef} tabIndex={-1}><Alert variant="error" title={`We could not save this ${c.one}`}>{formErr ?? "Fix the fields marked below. What you typed is kept."}</Alert></div>
        )}
        <Field label="Name" required error={errs.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => set("name", checkName(name))} />
        </Field>
        <Field label={c.amountLabel} required error={errs[c.amountKey]}>
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={() => set(c.amountKey, checkAmount(amount))} />
        </Field>
        {kind === "venue" && (
          <Field label="Location (optional)">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        )}
        <label className="flex min-h-11 items-center gap-3 text-body">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-6" />
          In use (can be booked)
        </label>
        {retiring && (
          <Alert variant="warning" title={`${row!.future} future event${row!.future === 1 ? "" : "s"} use this venue. They keep their booking, but new events cannot pick it.`} />
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={pending}>Save {c.one}</Button>
          <Button variant="secondary" onClick={onClose}>Go back</Button>
        </div>
      </form>
    </Card>
  );
}
