import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { CatalogSection } from "../_components/catalog-form";

export const metadata: Metadata = { title: "Venues and resources - College Events" };

type VenueItem = components["schemas"]["VenueItem"];
type ResourceItem = components["schemas"]["ResourceItem"];

export default async function Page() {
  await requireRole("admin");
  const [venues, resources] = await Promise.all([
    apiClient<VenueItem[]>("/api/venues"),
    apiClient<ResourceItem[]>("/api/resources"),
  ]);
  return (
    <div className="flex flex-col gap-12">
      <h1 className="text-display font-semibold">Venues and resources</h1>
      <CatalogSection
        kind="venue"
        rows={venues.map((v) => ({
          id: v.id,
          name: v.name,
          amount: v.capacity,
          active: !!v.active,
          location: v.location ?? "",
          future: v.future_events ?? 0,
          inUse: 0,
        }))}
      />
      <CatalogSection
        kind="resource"
        rows={resources.map((r) => ({
          id: r.id,
          name: r.name,
          amount: r.quantity,
          active: !!r.active,
          location: "",
          future: 0,
          inUse: r.in_use ?? 0,
        }))}
      />
    </div>
  );
}
