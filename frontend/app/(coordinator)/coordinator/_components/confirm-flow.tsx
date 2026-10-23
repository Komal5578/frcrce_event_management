"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Textarea } from "@/components/ui/field";
import { StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import type { ActionState } from "../actions";

/**
 * Review & Confirm for every irreversible coordinator action (X2).
 * `action` is a server action bound to its ids (e.g. submitAction.bind(null, id)); it receives the reason text when
 * `reasonLabel` is set. "{n}" in consequence/successBody is replaced by the count the action returns.
 */
export function ConfirmFlow({ triggerLabel, variant = "primary", verb, summary, consequence, action, successTitle, successBody, successStatus, reasonLabel, disabledReason, hideTrigger }: {
  triggerLabel: string;
  variant?: "primary" | "secondary" | "destructive";
  verb: string;
  summary: ReactNode;
  consequence: string;
  action: (reason: string) => Promise<ActionState>;
  successTitle: string;
  successBody: string;
  successStatus?: StatusKey;
  reasonLabel?: string;
  /** when set the trigger stays focusable but inactive, and this text is shown next to it */
  disabledReason?: string | null;
  /** after a terminal change the trigger goes away but the outcome Alert stays */
  hideTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<(ActionState & { title: string; body: string; badge?: StatusKey }) | null>(null);
  const [busy, start] = useTransition();
  const alertRef = useRef<HTMLDivElement>(null);

  // after success or failure the Alert takes focus so the outcome is announced and reachable
  useEffect(() => { if (result) alertRef.current?.focus(); }, [result]);

  const confirm = () =>
    start(async () => {
      const r = await action(reason);
      setOpen(false); // closes on success and on failure (pitfall 8)
      // texts are frozen now: the page may re-render with new props (e.g. Approved -> Open) before the Alert is read
      setResult({ ...r, title: successTitle, body: successBody, badge: successStatus });
    });
  const n = (s: string, c = 0) => s.replace("{n}", String(c));

  return (
    <div className="flex flex-col gap-3">
      {!hideTrigger && <div className="flex flex-wrap items-center gap-3">
        <Button variant={variant} disabled={!!disabledReason} onClick={() => { setResult(null); setOpen(true); }}>
          {triggerLabel}
        </Button>
        {disabledReason && <p className="text-label text-muted">{disabledReason}</p>}
      </div>}
      <ConfirmDialog
        open={open}
        verb={verb}
        busy={busy}
        summary={<>
          {summary}
          {reasonLabel && (
            <div className="mt-4">
              <Field label={reasonLabel}>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} autoComplete="off" />
              </Field>
            </div>
          )}
        </>}
        consequence={n(consequence, 0)}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
      <div aria-live="polite">
        {result?.ok && (
          <Alert ref={alertRef} variant="success" title={result.title}>
            <p>{n(result.body, result.count)}</p>
            {result.badge && <p className="mt-2"><StatusBadge status={result.badge} /></p>}
          </Alert>
        )}
        {result?.error && <Alert ref={alertRef} variant="error" title="That did not work">{result.error}</Alert>}
      </div>
    </div>
  );
}
