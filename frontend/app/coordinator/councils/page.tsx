"use client";

import React from "react";
import { CouncilsView } from "@/components/councils/CouncilsView";

export default function CoordinatorCouncilsPage() {
  return <CouncilsView isAdmin={false} baseHref="/coordinator/councils" />;
}
