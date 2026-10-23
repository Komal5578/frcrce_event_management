"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { setTaskAction } from "../actions";

/** Reversible, so no confirm dialog (UI-SPEC ST-05): Mark done shows "Marked done" with Undo. */
export function TaskCard({ id, title, eventId, eventTitle, due, badge, done }: {
  id: string; title: string; eventId: string; eventTitle: string; due: string | null; badge: StatusKey; done: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "done" | "error"; text?: string }>();
  const set = (label: string, kind: "done" | "undone") => start(async () => {
    const r = await setTaskAction(id, label);
    setMsg(r.error ? { kind: "error", text: r.error } : kind === "done" ? { kind: "done" } : undefined);
  });
  return (
    <li className="flex flex-col gap-2 rounded-control border border-border-card bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-heading font-semibold">{title}</h2>
        <StatusBadge status={badge} />
      </div>
      <p className="text-body"><Link href={`/student/events/${eventId}`} className="font-semibold text-accent underline">{eventTitle}</Link></p>
      {due && <p className="text-body">Due {due}</p>}
      <Button variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={() => set(done ? "To do" : "Done", done ? "undone" : "done")}>
        {done ? "Mark as to do" : "Mark done"}<span className="sr-only"> for {title}</span>
      </Button>
      {msg?.kind === "done" && (
        <Alert variant="success" title="Marked done">
          <Button variant="secondary" disabled={pending} onClick={() => set("To do", "undone")}>Undo<span className="sr-only"> marking {title} done</span></Button>
        </Alert>
      )}
      {msg?.kind === "error" && <Alert variant="error" title="Could not update the task">{msg.text}</Alert>}
    </li>
  );
}
