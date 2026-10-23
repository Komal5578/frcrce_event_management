import Link from "next/link";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  body: string;
  action?: { label: string; href: string };
  icon?: ReactNode;
};

export function EmptyState({ title, body, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-ui rounded-control gap-3 max-w-md mx-auto my-8">
      {icon && <div aria-hidden="true" className="text-muted">{icon}</div>}
      <h2 className="text-h3 font-semibold text-ink">{title}</h2>
      <p className="text-body text-muted">{body}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center gap-2 rounded-control text-label font-semibold transition-colors duration-150 bg-surface text-ink border border-border-ui min-h-11 min-w-11 px-4 py-2 hover:bg-muted/10 mt-2"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
