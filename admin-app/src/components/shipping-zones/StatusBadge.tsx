import { AlertTriangle, Check, Lock, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ShippingZoneStatus } from "@/types/shipping-zones";

const STATUS_STYLES: Record<ShippingZoneStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  needs_update: {
    label: "Needs update",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  missing: {
    label: "Missing setup",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  protected: {
    label: "Protected manual zone",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  conflict: {
    label: "Conflict detected",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  checking: {
    label: "Checking",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  unavailable: {
    label: "Unavailable",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  not_managed: {
    label: "Not managed",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
};

export function StatusBadge({ status }: { status: ShippingZoneStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium",
        style.className,
      )}
    >
      {status === "active" && <Check className="h-3 w-3" />}
      {(status === "missing" || status === "conflict") && <AlertTriangle className="h-3 w-3" />}
      {(status === "protected" || status === "not_managed") && <Lock className="h-3 w-3" />}
      {status === "checking" && <RefreshCw className="h-3 w-3 animate-spin" />}
      {style.label}
    </span>
  );
}
