import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Illustration, type Art } from "./illustrations";

/** Say what is missing and offer the next action. */
export function EmptyState({ icon: Icon, art, title, body, action }: { icon: LucideIcon; art?: Art; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-line px-6 py-12 text-center">
      {art ? <Illustration art={art} /> : <Icon className="size-10 text-brand" strokeWidth={1.6} aria-hidden />}
      <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
      {body ? <p className="mt-1 max-w-sm text-[15px] text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl bg-danger-soft px-6 py-10 text-center">
      <AlertCircle className="size-8 text-danger" aria-hidden />
      <h2 className="mt-3 text-lg font-bold text-ink">We could not load this</h2>
      <p className="mt-1 max-w-sm text-[15px] text-muted">{message ?? "Your data is safe. Check your connection and try again."}</p>
      {onRetry ? <Button className="mt-4" variant="secondary" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}
