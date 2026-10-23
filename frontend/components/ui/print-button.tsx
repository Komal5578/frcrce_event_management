"use client";

import { Printer } from "lucide-react";
import { Button } from "./button";

export function PrintButton() {
  return (
    <Button
      variant="secondary"
      onClick={() => window.print()}
      data-no-print
      className="gap-2"
    >
      <Printer size={18} aria-hidden="true" />
      Print
    </Button>
  );
}
