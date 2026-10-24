"use client";

import { CircleCheck, CircleX, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useFlash } from "@/components/ui/toast";
import { api, errText } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { ResourceItem, VenueItem } from "@/lib/types";

type Kind = "venue" | "resource";
type Row = { id: string | null; name: string; qty: string; location: string; active: boolean };
const blank: Row = { id: null, name: "", qty: "", location: "", active: true };

function Pill({ on }: { on: boolean }) {
  return <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold ring-1 ring-inset", on ? "bg-[var(--st-open-bg)] text-[var(--st-open-fg)] ring-[var(--st-open-fg)]/25" : "bg-[var(--st-draft-bg)] text-[var(--st-draft-fg)] ring-[var(--st-draft-fg)]/25")}>{on ? <CircleCheck className="size-3.5" aria-hidden /> : <CircleX className="size-3.5" aria-hidden />}{on ? "Available" : "Retired"}</span>;
}

export default function Catalog() {
  const { data: venues, error: ve, mutate: mv } = useSWR<VenueItem[]>("/api/venues");
  const { data: resources, error: re, mutate: mr } = useSWR<ResourceItem[]>("/api/resources");
  const flash = useFlash();
  const [edit, setEdit] = useState<{ kind: Kind; row: Row } | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [warn, setWarn] = useState<{ kind: Kind; row: Row; n: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (kind: Kind, row: Row = blank) => { setErrs({}); setEdit({ kind, row }); };

  async function persist(kind: Kind, r: Row) {
    setBusy(true);
    const path = kind === "venue" ? "/api/venues" : "/api/resources";
    const body = kind === "venue" ? { id: r.id, name: r.name.trim(), capacity: Number(r.qty), location: r.location.trim() || null, active: r.active } : { id: r.id, name: r.name.trim(), quantity: Number(r.qty), active: r.active };
    try {
      await api(r.id ? `${path}/${r.id}` : path, { method: r.id ? "PUT" : "POST", json: body });
      flash(`${r.name.trim()} ${r.id ? "saved" : "added"}.`);
      if (kind === "venue") mv(); else mr();
      setEdit(null); setWarn(null);
    } catch (e) { flash(errText(e), { kind: "err" }); } finally { setBusy(false); }
  }

  function save() {
    if (!edit) return;
    const { kind, row } = edit; const e: Record<string, string> = {};
    if (!row.name.trim()) e.name = "Give it a name people will recognise.";
    if (!row.qty || Number(row.qty) < 1) e.qty = kind === "venue" ? "Enter how many people it seats (1 or more)." : "Enter how many you own (1 or more).";
    setErrs(e); if (Object.keys(e).length) return;
    const was = (kind === "venue" ? venues : resources)?.find((x) => x.id === row.id);
    const n = kind === "venue" ? (was as VenueItem | undefined)?.future_events ?? 0 : (was as ResourceItem | undefined)?.reserved_peak ?? 0;
    // Changes that affect booked events are flagged before saving.
    if (row.id && was && was.active && !row.active && n > 0) return setWarn({ kind, row, n });
    persist(kind, row);
  }

  const table = (kind: Kind, items: ResourceItem[] | VenueItem[] | undefined, err: unknown, retry: () => void) =>
    err ? <ErrorState onRetry={retry} /> : !items ? <div className="p-4"><Skeleton className="h-40" /></div> : (
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-[15px]">
          <caption className="sr-only">{kind === "venue" ? "Venues" : "Resources"}</caption>
          <thead><tr className="border-b border-line text-sm text-muted"><th scope="col" className="px-5 py-2.5 font-semibold">Name</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">{kind === "venue" ? "Seats" : "Total"}</th><th scope="col" className="px-3 py-2.5 text-right font-semibold">{kind === "venue" ? "Future events" : "In use now"}</th><th scope="col" className="px-3 py-2.5 font-semibold">Availability</th><th scope="col" className="px-5 py-2.5"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {items.map((x) => {
              const v = x as VenueItem & ResourceItem;
              return (
                <tr key={x.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                  <th scope="row" className="px-5 py-3 font-bold">{x.name}{kind === "venue" && v.location ? <span className="block text-[13px] font-medium text-muted">{v.location}</span> : null}</th>
                  <td className="num px-3 py-3 text-right">{kind === "venue" ? v.capacity : v.quantity}</td>
                  <td className="num px-3 py-3 text-right text-muted">{kind === "venue" ? v.future_events ?? 0 : v.in_use ?? 0}</td>
                  <td className="px-3 py-3"><Pill on={x.active} /></td>
                  <td className="px-5 py-1.5 text-right"><Button size="sm" variant="ghost" aria-label={`Edit ${x.name}`} onClick={() => open(kind, { id: x.id, name: x.name, qty: String(kind === "venue" ? v.capacity : v.quantity), location: kind === "venue" ? v.location ?? "" : "", active: x.active })}><Pencil className="size-4" aria-hidden />Edit</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  return (
    <>
      <PageHeader title="Venues & Resources" sub="Keep capacity and availability current. Changes that touch booked events are flagged first." />
      <div className="grid gap-5 2xl:grid-cols-2">
        <Card><CardHeader title="Venues" aside={<Button size="sm" onClick={() => open("venue")}><Plus className="size-4" aria-hidden />Add venue</Button>} /><div className="mt-2">{table("venue", venues, ve, () => mv())}</div></Card>
        <Card><CardHeader title="Resources" aside={<Button size="sm" onClick={() => open("resource")}><Plus className="size-4" aria-hidden />Add resource</Button>} /><div className="mt-2">{table("resource", resources, re, () => mr())}</div></Card>
      </div>

      <ConfirmDialog open={!!edit} verb="save" title={edit ? `${edit.row.id ? "Edit" : "Add"} ${edit.kind}` : ""} confirmLabel="Save" summary={edit ? (
        <div className="space-y-3.5">
          <Field label="Name" required error={errs.name}>{(i, d) => <Input id={i} aria-describedby={d} value={edit.row.name} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, name: e.target.value } })} />}</Field>
          <Field label={edit.kind === "venue" ? "Seats" : "Total owned"} required error={errs.qty}>{(i, d) => <Input id={i} aria-describedby={d} type="number" min={1} inputMode="numeric" value={edit.row.qty} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, qty: e.target.value } })} />}</Field>
          {edit.kind === "venue" ? <Field label="Location">{(i) => <Input id={i} value={edit.row.location} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, location: e.target.value } })} />}</Field> : null}
          <label className="flex min-h-11 items-center gap-3 text-[15px] font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={edit.row.active} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, active: e.target.checked } })} />Available to book</label>
        </div>
      ) : null} consequence="The change applies to new bookings straight away." onConfirm={save} onCancel={() => setEdit(null)} />
      <ConfirmDialog open={!!warn} verb="retire" destructive title="This is in use" summary={warn ? <p><b>{warn.row.name}</b> is used by {warn.n} upcoming {warn.n === 1 ? "event" : "events"}.</p> : null} consequence="Those events keep what they booked, but nobody can book it again until you make it available." confirmLabel="Retire anyway" onConfirm={() => (warn ? persist(warn.kind, warn.row) : undefined)} onCancel={() => setWarn(null)} />
      {busy ? <span className="sr-only" role="status">Saving</span> : null}
    </>
  );
}
