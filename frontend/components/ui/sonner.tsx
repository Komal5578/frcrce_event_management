"use client";

import { Toaster } from "sonner";

/**
 * Unified toast feedback system (sonner).
 *
 * Wraps sonner's Toaster with project theme tokens and polite
 * screen-reader announcements (aria-live="polite" for status messages).
 *
 * Usage:
 *   // In root layout or page wrapper:
 *   <SonnerProvider />
 *
 *   // Trigger toasts from anywhere:
 *   import { toast } from "sonner";
 *   toast.success("Registered successfully");
 *   toast.error("Could not save. Please try again.");
 */
export function SonnerProvider() {
  return (
    <Toaster
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: [
            "rounded-card border border-border-card bg-surface text-ink shadow-md",
            "text-label font-medium",
          ].join(" "),
          title: "font-semibold text-ink",
          description: "text-fine text-muted",
          actionButton: [
            "inline-flex min-h-9 items-center rounded-control px-3 text-fine font-semibold",
            "bg-accent text-accent-contrast hover:bg-accent-hover",
          ].join(" "),
          cancelButton: [
            "inline-flex min-h-9 items-center rounded-control px-3 text-fine font-semibold",
            "bg-panel text-ink border border-border-ui hover:bg-surface",
          ].join(" "),
          closeButton: [
            "inline-flex min-h-9 min-w-9 items-center justify-center rounded-control",
            "text-muted hover:text-ink hover:bg-panel",
          ].join(" "),
        },
        duration: 5000,
      }}
    />
  );
}

/**
 * Re-export toast from sonner so callers get a single import point.
 * Usage: import { toast } from "@/components/ui/sonner";
 */
export { toast } from "sonner";
