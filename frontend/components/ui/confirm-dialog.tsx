"use client";

import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/cn";

/**
 * Review & Confirm (X2): summary, what will happen, Confirm / Go back.
 * Native <dialog>: focus trap + Esc for free. First focus is "Go back" (the safe choice).
 */
export function ConfirmDialog({
  open, verb, title, summary, consequence, destructive, onConfirm, onCancel, children, confirmLabel,
}: {
  open: boolean;
  verb: string;
  title?: string;
  summary: ReactNode;
  consequence: string;
  destructive?: boolean;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) { setClosing(false); el.showModal(); }
    if (!open && el.open) el.close();
  }, [open]);

  const close = () => {
    setClosing(true);
    setTimeout(onCancel, 140);
  };

  const run = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); close(); }}
      aria-labelledby={titleId}
      className={cn(
        "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-3xl bg-surface p-0 text-ink shadow-pop border border-line",
        closing ? "animate-[pop-out_.14s_ease-in_forwards]" : "animate-[pop-in_.22s_cubic-bezier(.22,1,.36,1)]",
      )}
    >
      <div className="p-6">
        <div className={cn("mb-4 grid size-12 place-items-center rounded-2xl", destructive ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand")}>
          {destructive ? <TriangleAlert className="size-6" aria-hidden /> : <ShieldCheck className="size-6" aria-hidden />}
        </div>
        <h2 id={titleId} className="text-xl font-extrabold tracking-tight">{title ?? `Review before you ${verb}`}</h2>
        <div className="mt-3 rounded-2xl bg-surface-2 p-4 text-[15px] border border-line">{summary}</div>
        <p className="mt-4 text-[15px] text-muted"><span className="font-bold text-ink">What will happen: </span>{consequence}</p>
        {children}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 p-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" autoFocus onClick={close} disabled={busy}>Go back</Button>
        <Button variant={destructive ? "danger" : "primary"} loading={busy} onClick={run}>{confirmLabel ?? `Confirm ${verb}`}</Button>
      </div>
      <style>{`
        @keyframes pop-in{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes pop-out{to{opacity:0;transform:translateY(8px) scale(.98)}}
      `}</style>
    </dialog>
  );
}
