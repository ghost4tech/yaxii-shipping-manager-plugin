import { Check, X } from "lucide-react";

import { ownershipLabel, formatDzdPrice, liveMethodForKey } from "@/lib/shipping-zones/status";
import { cn } from "@/lib/utils";
import type { ShippingZoneRowView } from "@/types/shipping-zones";

export function ShippingZoneDetails({ row }: { row: ShippingZoneRowView }) {
  if (row.liveZone.zones.length === 0) {
    return (
      <div className="mx-4 mb-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        No WooCommerce zone is currently matched to this wilaya.
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground md:grid-cols-2">
      {row.liveZone.zones.map((zone) => (
        <div key={zone.zoneId} className="space-y-2">
          <div className="font-medium text-foreground/80">{zone.name}</div>
          <DetailLine label={ownershipLabel(zone.ownershipHint)} ok />
          <DetailLine label="WooCommerce zone exists" ok />
          <DetailLine
            label={`${row.home.label}: ${formatDzdPrice(
              liveMethodForKey(zone, row.home.key) ? row.home.livePrice : null,
            )}`}
            ok={Boolean(liveMethodForKey(zone, row.home.key))}
          />
          <DetailLine
            label={`${row.office.label}: ${formatDzdPrice(
              liveMethodForKey(zone, row.office.key) ? row.office.livePrice : null,
            )}`}
            ok={Boolean(liveMethodForKey(zone, row.office.key))}
          />
        </div>
      ))}
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
