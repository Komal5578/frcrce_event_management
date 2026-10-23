"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Below 1024px show one pane (queue on the list page, detail on an event); from 1024px show both. */
export function PaneSwitch({ queue, children }: { queue: ReactNode; children: ReactNode }) {
  const detail = usePathname() !== "/admin/approvals";
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[clamp(280px,30%,360px)_1fr]">
      <div className={detail ? "hidden lg:block" : "block"}>{queue}</div>
      <div className={detail ? "block" : "hidden lg:block"}>{children}</div>
    </div>
  );
}
