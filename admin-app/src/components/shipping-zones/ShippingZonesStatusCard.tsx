import { Activity, ChevronRight, Lock, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ShippingZoneStats } from "@/types/shipping-zones";

export function ShippingZonesStatusCard({
  stats,
  woocommerceSettingsUrl,
  onOpenDiagnostics,
}: {
  stats: ShippingZoneStats;
  woocommerceSettingsUrl: string;
  onOpenDiagnostics: () => void;
}) {
  const items = [
    { label: "Active wilayas", value: stats.activeWilayas, icon: Activity },
    { label: "Managed methods", value: stats.managedMethods, icon: Zap },
    { label: "Pending changes", value: stats.pendingChanges, icon: ChevronRight },
    { label: "Protected zones", value: stats.protectedManualZones, icon: Lock },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5 bg-card px-5 py-4">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
            <div className="text-2xl font-semibold tracking-tight">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-3 border-t border-border bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
          WooCommerce will be checked again before updating. Manual, theme, and external zones will
          not be touched.
        </p>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={onOpenDiagnostics}
          >
            <Activity className="h-3.5 w-3.5" />
            Diagnostics
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => window.open(woocommerceSettingsUrl, "_blank", "noopener,noreferrer")}
          >
            WooCommerce zones
          </Button>
        </div>
      </div>
    </div>
  );
}
