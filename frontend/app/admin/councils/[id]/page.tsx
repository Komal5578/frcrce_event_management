"use client";

import React, { use } from "react";
import { CouncilDetailView } from "@/components/councils/CouncilDetailView";

export default function AdminCouncilDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <CouncilDetailView councilSlug={resolvedParams.id} baseHref="/admin/councils" />;
}
