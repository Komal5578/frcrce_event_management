"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cancelRegistrationAction } from "../actions";
import { useFlash } from "./flash";

/** Cancel registration through Review & Confirm; destructive wording. */
export function CancelFlow({ eventId, title, when, waitlisted = false }: { eventId: string; title: string; when: string; waitlisted?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const flash = useFlash();
  const label = waitlisted ? "Leave waitlist" : "Cancel registration";

  function confirm() {
    start(async () => {
      const r = await cancelRegistrationAction(eventId);
      setOpen(false);
      if (r.error) return setError(r.error);
      setError(undefined);
      flash({ title: waitlisted ? "You left the waitlist" : "Registration cancelled", body: `${title}: your place is released.` });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        {label}
        <span className="sr-only"> for {title}</span>
      </Button>
      <ConfirmDialog
        open={open}
        verb={waitlisted ? "leave waitlist" : "cancel registration"}
        busy={pending}
        summary={
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-semibold">Event</dt><dd>{title}</dd>
            <dt className="font-semibold">When</dt><dd>{when}</dd>
          </dl>
        }
        consequence={waitlisted
          ? "You give up your place on the waitlist. You can join again later if the event is still open."
          : "You give up your seat and the next person on the waitlist, if any, is moved up. You can register again if a seat is free."}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
      {error && <Alert variant="error" title="Could not cancel">{error}</Alert>}
    </div>
  );
}
