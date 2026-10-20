"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

/** Review & Confirm skeleton (X2): submit, register, cancel, approve, return. Children only, never HTML strings. */
export function ConfirmDialog({ open, title, verb, summary, consequence, onConfirm, onCancel, busy }: {
  open: boolean;
  title?: string;
  verb: string;
  summary: ReactNode;
  consequence: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // showModal moves focus into the dialog; close() returns it to the opener.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault(); // parent owns state; it sets open=false
        onCancel();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-control border border-border-card bg-surface p-6 text-ink shadow-lg backdrop:bg-black/40"
    >
      <h2 id="confirm-title" className="text-heading font-semibold">
        {title ?? `Review before you ${verb}`}
      </h2>
      <div className="mt-4">{summary}</div>
      <p className="mt-4 text-body">{consequence}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={onConfirm} loading={busy}>
          Confirm {verb}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Go back
        </Button>
      </div>
    </dialog>
  );
}
