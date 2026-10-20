"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";

/** Success Alert that takes focus on arrival (after a redirect from the builder). */
export function Flash({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return <Alert ref={ref} variant="success" title={title}>{children}</Alert>;
}
