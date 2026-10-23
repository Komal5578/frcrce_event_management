"use client";

import { PageError } from "@/components/ui/page-error";

export default function RootError({
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

  return <PageError onRetry={onRetry} homeHref="/" />;
}
