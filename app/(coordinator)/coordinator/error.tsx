"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="error" title="We could not load your events">
        Your work is safe. Check your connection and try again.
      </Alert>
      <div><Button variant="secondary" onClick={reset}>Try again</Button></div>
    </div>
  );
}
