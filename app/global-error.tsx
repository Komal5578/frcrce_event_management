"use client";

import "./globals.css";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
  retry,
}: {
  error: Error;
  reset?: () => void;
  retry?: () => void;
}) {
  const onRetry = () => {
    if (typeof retry === "function") {
      retry();
    } else if (typeof reset === "function") {
      reset();
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Error — College Events</title>
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <h1 className="text-h1 font-bold text-ink">We could not load this page</h1>
          <p className="text-body text-muted">
            Your work is safe. Check your connection and try again.
          </p>
          <div className="mt-2">
            <Button onClick={onRetry}>Try again</Button>
          </div>
        </div>
      </body>
    </html>
  );
}
