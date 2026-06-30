import { Check, X } from "lucide-react";

import { ownershipLabel, formatDzdPrice, liveMethodForKey } from "@/lib/shipping-zones/status";
import { cn } from "@/lib/utils";
import type { ShippingZoneRowView } from "@/types/shipping-zones";

export function ShippingZoneDetails({ row }: { row: ShippingZoneRowView }) {
  if (row.liveZone.zones.length === 0) {
    return (
      <div className="mx-4 mb-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        {row.status === "missing"
          ? "This wilaya is missing its Yaxii-managed WooCommerce setup."
          : "No WooCommerce zone is currently matched to this wilaya."}
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 rounded-md border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
      {row.status === "missing" && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          This wilaya is missing its Yaxii-managed zone or methods.
        </div>
      )}
      {row.status === "protected" && (
        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
          Yaxii will not edit this WooCommerce zone.
        </div>
      )}
      {row.status === "not_managed" && (
        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
          This zone is not recorded in Yaxii's managed registry.
        </div>
      )}
      {row.status === "updating" && (
        <div className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sky-900">
          Update sent. Refreshing WooCommerce diagnostics before showing the final status.
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {row.liveZone.zones.map((zone) => (
          <div key={zone.zoneId} className="space-y-2">
            <div className="font-medium text-foreground/80">{zone.name}</div>
            <DetailLine label={ownershipLabel(zone.ownershipHint)} ok />
            <DetailLine label="WooCommerce zone exists" ok />
            {row.methods.map((method) => (
              <DetailLine
                key={method.key}
                label={`${method.label}: ${formatDzdPrice(
                  liveMethodForKey(zone, method.key) ? method.livePrice : null,
                )}`}
                ok={Boolean(liveMethodForKey(zone, method.key))}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full",
          ok ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
        )}
      >
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <span className={cn(ok && "text-foreground/80")}>{label}</span>
    </div>
  );
}
