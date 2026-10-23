import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode, Ref } from "react";

// Reuses status colour families: info=approved, success=open, warning=pending, error=cancelled.
const VARIANTS = {
  info: { Icon: Info, className: "text-status-approved-fg bg-status-approved-bg border-status-approved-fg" },
  success: { Icon: CircleCheck, className: "text-status-open-fg bg-status-open-bg border-status-open-fg" },
  warning: { Icon: TriangleAlert, className: "text-status-pending-fg bg-status-pending-bg border-status-pending-fg" },
  error: { Icon: CircleAlert, className: "text-status-cancelled-fg bg-status-cancelled-bg border-status-cancelled-fg" },
} as const;

export function Alert({ variant, title, children, ref }: {
  variant: keyof typeof VARIANTS;
  title: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  const { Icon, className } = VARIANTS[variant];
  return (
    <div ref={ref} tabIndex={-1} role={variant === "error" ? "alert" : "status"} className={`flex gap-3 rounded-control border p-4 ${className}`}>
      <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div>
        <p className="text-label font-semibold">{title}</p>
        {children && <div className="text-body">{children}</div>}
      </div>
    </div>
  );
}
