import { CircleAlert } from "lucide-react";
import { cloneElement, useId, type InputHTMLAttributes, type ReactElement, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const CONTROL =
  "block w-full min-h-11 rounded-control border border-border-ui bg-surface px-3 py-2 text-body text-ink hover:bg-panel";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} ${props.className ?? ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL} min-h-24 ${props.className ?? ""}`} />;
}

type ControlProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean; required?: boolean };

/** Label above, helper and error text wired by id. Pass one Input/Select/Textarea as the child. */
export function Field({ label, helper, error, required, children }: {
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: ReactElement<ControlProps>;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [helper && helpId, error && errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-label font-semibold">
        {label}
        {required ? " (required)" : ""}
      </label>
      {helper && (
        <p id={helpId} className="text-label text-muted">
          {helper}
        </p>
      )}
      {cloneElement(children, { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required })}
      {error && (
        <p id={errId} className="flex items-center gap-1 text-label font-semibold text-destructive">
          <CircleAlert size={16} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
