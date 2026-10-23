"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function PageError({
  onRetry,
  homeHref,
}: {
  onRetry: () => void;
  homeHref?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-6 max-w-xl my-8">
      <Alert variant="error" title="We could not load this page">
        Your work is safe. Check your connection and try again.
      </Alert>
      <div className="flex items-center gap-4">
        <Button onClick={onRetry}>Try again</Button>
        {homeHref && (
          <Link
            href={homeHref}
            className="text-body text-accent hover:underline min-h-11 inline-flex items-center"
          >
            Go to my home
          </Link>
        )}
      </div>
    </div>
  );
}
