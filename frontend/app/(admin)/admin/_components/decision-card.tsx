"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Textarea } from "@/components/ui/field";
import { approveAction, returnAction } from "../actions";

export type DecisionSummary = { title: string; when: string; venue: string; seats: string; resources: string; clash: string };
type Result = { kind: "approve" | "return" } | { error: string };
const EMPTY = "Add a short reason so the coordinator knows what to fix.";
const linkBtn = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-accent bg-accent px-4 py-2 text-label font-semibold text-white";

/** Stays mounted after the decision (the page re-renders with a non-pending event) so the success message survives. */
export function DecisionCard({ eventId, pending, canApprove, summary, nextId }: {
  eventId: string; pending: boolean; canApprove: boolean; summary: DecisionSummary; nextId: string | null;
}) {
  const [mode, setMode] = useState<"approve" | "return" | null>(null);
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonErr, setReasonErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const done = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const focusReason = () => area.current?.querySelector("textarea")?.focus();
  useEffect(() => { if (result) done.current?.focus(); }, [result]);
  useEffect(() => { if (returning) focusReason(); }, [returning]);

  async function confirm() {
    if (!mode) return;
    setBusy(true);
    try {
      const r = mode === "approve" ? await approveAction(eventId) : await returnAction(eventId, reason);
      setResult(r.ok ? { kind: mode } : { error: r.error ?? "We could not save your decision. Nothing was changed. Try again." });
    } catch {
      setResult({ error: "We could not save your decision. Nothing was changed. Try again." });
    }
    setBusy(false);
    setMode(null);
  }
  function review() {
    if (!reason.trim()) { setReasonErr(EMPTY); focusReason(); return; }
    setMode("return");
  }

  if (result && "kind" in result)
    return (
      <div className="flex flex-col gap-3">
        <Alert ref={done} variant="success" title={result.kind === "approve" ? "Approved" : "Returned"}>
          {result.kind === "approve" ? "The coordinator has been notified." : "The coordinator has been notified with your reason."}
        </Alert>
        {nextId && <div><Link href={`/admin/approvals/${nextId}`} className={linkBtn}>Next waiting event</Link></div>}
      </div>
    );
  if (!pending) return null;

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-heading font-semibold">Your decision</h2>
      {result && "error" in result && <div ref={done} tabIndex={-1}><Alert variant="error" title="We could not save your decision. Nothing was changed. Try again.">{result.error}</Alert></div>}
      {canApprove ? (
        <div><Button onClick={() => setMode("approve")}>Approve</Button></div>
      ) : (
        <p className="text-body">Fix the conflict or return the event.</p>
      )}
      {returning ? (
        <div ref={area} className="flex flex-col gap-3">
          <Field label="Reason for returning" required helper="Say what the coordinator needs to fix." error={reasonErr}>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} onBlur={() => setReasonErr(reason.trim() ? undefined : EMPTY)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={review}>Review return</Button>
            <Button variant="ghost" onClick={() => { setReturning(false); setReasonErr(undefined); }}>Go back</Button>
          </div>
        </div>
      ) : (
        <div><Button variant="secondary" onClick={() => setReturning(true)}>Return with reason</Button></div>
      )}
      <ConfirmDialog
        open={mode !== null}
        verb={mode === "return" ? "return" : "approve"}
        busy={busy}
        onCancel={() => setMode(null)}
        onConfirm={confirm}
        consequence={mode === "return" ? "The event goes back to the coordinator to fix and submit again." : "The venue is booked for this time and the coordinator is told in the app."}
        summary={
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body">
            <dt className="font-semibold">Event</dt><dd>{summary.title}</dd>
            <dt className="font-semibold">When</dt><dd>{summary.when}</dd>
            <dt className="font-semibold">Where</dt><dd>{summary.venue}</dd>
            <dt className="font-semibold">Seats</dt><dd>{summary.seats}</dd>
            <dt className="font-semibold">Resources</dt><dd>{summary.resources}</dd>
            {mode === "return"
              ? (<><dt className="font-semibold">Reason</dt><dd className="whitespace-pre-wrap">{reason}</dd></>)
              : (<><dt className="font-semibold">Clash check</dt><dd>{summary.clash}</dd></>)}
          </dl>
        }
      />
    </Card>
  );
}
