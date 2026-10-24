import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full min-h-11 rounded-xl bg-surface px-3.5 text-[15px] text-ink border border-line-strong placeholder:text-faint transition focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-surface-2 disabled:text-muted";

export function Field({
  label, hint, error, required, children,
}: { label: string; hint?: string; error?: string; required?: boolean; children: (id: string, describedBy?: string) => ReactNode }) {
  const id = useId();
  const dId = hint || error ? `${id}-d` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="ml-1 font-normal text-muted">(required)</span> : null}
      </label>
      {children(id, dId)}
      {error ? (
        <p id={dId} role="alert" className="text-sm font-medium text-danger">{error}</p>
      ) : hint ? (
        <p id={dId} className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(base, className)} {...p} />
);
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(base, "pr-8", className)} {...p} />
);
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(base, "min-h-24 py-2.5", className)} {...p} />
);
