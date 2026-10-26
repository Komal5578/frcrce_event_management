"use client";

import React from "react";
import { CouncilsView } from "@/components/councils/CouncilsView";

export default function AdminCouncilsPage() {
  return <CouncilsView isAdmin={true} baseHref="/admin/councils" />;
}
