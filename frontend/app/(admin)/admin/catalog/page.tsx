import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listResources, listVenues } from "@/lib/domain/catalog";
import { CatalogSection } from "../_components/catalog-form";

export const metadata: Metadata = { title: "Venues and resources - College Events" };

export default async function Page() {
  const p = await requireRole("admin");
  const actor = { id: p.id, role: p.role };
  const [venues, resources] = await Promise.all([listVenues(actor), listResources(actor)]);
  return (
    <div className="flex flex-col gap-12">
      <h1 className="text-display font-semibold">Venues and resources</h1>
      <CatalogSection kind="venue" rows={venues.map((v) => ({ id: v.id, name: v.name, amount: v.capacity, active: !!v.active, location: v.location ?? "", future: v.future_events, inUse: 0 }))} />
      <CatalogSection kind="resource" rows={resources.map((r) => ({ id: r.id, name: r.name, amount: r.quantity, active: !!r.active, location: "", future: 0, inUse: r.in_use }))} />
    </div>
  );
}
