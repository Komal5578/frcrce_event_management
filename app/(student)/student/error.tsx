"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <Alert variant="error" title="We could not load events. Check your connection and try again." />
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
