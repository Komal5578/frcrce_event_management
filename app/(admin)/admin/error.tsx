"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <Alert variant="error" title="We could not load the dashboard numbers.">Your data is safe. Try again in a moment.</Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
