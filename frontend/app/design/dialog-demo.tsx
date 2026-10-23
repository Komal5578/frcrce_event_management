"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => setOpen(true)}>Register for demo event</Button>
      </div>
      <ConfirmDialog
        open={open}
        verb="register"
        summary={<p>Demo Hackathon, Main Hall, 10 Nov 2026, 10:00 to 12:00.</p>}
        consequence="You will get a seat. You can cancel later from My registrations."
        onConfirm={() => {
          setOpen(false);
          setDone(true);
        }}
        onCancel={() => setOpen(false)}
      />
      {done && <Alert variant="success" title="You are registered for Demo Hackathon." />}
    </div>
  );
}
