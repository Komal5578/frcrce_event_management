"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./button";

/**
 * Review & Confirm dialog (X2): submit, register, cancel, approve, return.
 *
 * Accessibility contract:
 * - On open, initial focus goes to the "Go back" button to prevent accidental
 *   destructive confirmations (WCAG 2.2 SC 3.3.4).
 * - Escape key closes the dialog (native <dialog> behaviour).
 * - Focus is trapped inside the modal via showModal().
 */
export function ConfirmDialog({
  open,
  title,
  verb,
  summary,
  consequence,
  onConfirm,
  onCancel,
  busy,
  variant = "default",
}: {
  open: boolean;
  title?: string;
  verb: string;
  summary: ReactNode;
  consequence: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  variant?: "default" | "destructive";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const goBackRef = useRef<HTMLButtonElement>(null);

  // showModal() traps focus; we then move it to "Go back" to prevent accidental confirm.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // Defer focus so the dialog is fully shown before focusing
      requestAnimationFrame(() => {
        goBackRef.current?.focus();
      });
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault(); // parent owns state; it sets open=false
        onCancel();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card border border-border-card bg-surface p-6 text-ink shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <h2 id="confirm-title" className="text-heading font-semibold text-ink">
        {title ?? `Review before you ${verb}`}
      </h2>
      <div className="mt-4 text-body text-ink">{summary}</div>
      <p className="mt-4 text-body text-muted">{consequence}</p>
      <div className="mt-6 flex flex-wrap-reverse gap-3">
        {/* "Go back" is listed first in DOM for natural tab order, but rendered second via flex-row-reverse */}
        <Button
          ref={goBackRef}
          variant="secondary"
          onClick={onCancel}
          id="confirm-go-back"
        >
          Go back
        </Button>
        <Button
          variant={variant === "destructive" ? "destructive" : "primary"}
          onClick={onConfirm}
          loading={busy}
          id="confirm-action"
        >
          {verb}
        </Button>
      </div>
    </dialog>
  );
}
