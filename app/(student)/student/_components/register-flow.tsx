"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { registerAction } from "../actions";
import { useFlash } from "./flash";

/** Register / Join waitlist through Review & Confirm (X2). Errors stay beside the button; success goes to the page-level flash. */
export function RegisterFlow({ eventId, title, when, where, mode, primary }: {
  eventId: string; title: string; when: string; where: string; mode: "register" | "waitlist"; primary: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const flash = useFlash();
  const router = useRouter();
  const waitlist = mode === "waitlist";
  const verb = waitlist ? "join the waitlist" : "register";

  function confirm() {
    start(async () => {
      const r = await registerAction(eventId);
      setOpen(false);
      if (r.error) {
        setError(r.error);
        router.refresh(); // the card may now offer Join waitlist
        return;
      }
      setError(undefined);
      flash(r.status === "waitlisted"
        ? { title: "You are on the waitlist", body: `${title}: we will move you up if a seat opens.`, link: { href: "/student/mine", label: "View my events" } }
        : { title: "You are registered", body: `${title}: see it under My events.`, link: { href: "/student/mine", label: "View my events" } });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant={primary ? "primary" : "secondary"} className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        {waitlist ? "Join waitlist" : "Register"}
        <span className="sr-only"> for {title}</span>
      </Button>
      <ConfirmDialog
        open={open}
        verb={verb}
        busy={pending}
        summary={
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="font-semibold">Event</dt><dd>{title}</dd>
            <dt className="font-semibold">When</dt><dd>{when}</dd>
            <dt className="font-semibold">Where</dt><dd>{where}</dd>
          </dl>
        }
        consequence={waitlist
          ? "You join the waitlist and are moved up if a seat opens. You can leave any time."
          : "You get a seat. You can cancel later."}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
      {error && <Alert variant="error" title="Could not register">{error}</Alert>}
    </div>
  );
}
