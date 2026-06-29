import { Activity, ExternalLink, Package, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShippingZonesHeader({
  hasMissingSetup,
  woocommerceSettingsUrl,
  onLaunchWizard,
  onOpenDiagnostics,
}: {
  hasMissingSetup: boolean;
  woocommerceSettingsUrl: string;
  onLaunchWizard: () => void;
  onOpenDiagnostics: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Shipping Zones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage wilaya delivery prices from one place.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {hasMissingSetup && (
          <Button onClick={onLaunchWizard} className="h-9 gap-1.5 rounded-md">
            <Wand2 className="h-4 w-4" />
            Open Generator
          </Button>
        )}
        <Button variant="outline" onClick={onOpenDiagnostics} className="h-9 gap-1.5 rounded-md">
          <Activity className="h-4 w-4" />
          Diagnostics
        </Button>
        <Button
          variant="ghost"
          className="h-9 gap-1.5 rounded-md"
          onClick={() => window.open(woocommerceSettingsUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" />
          WooCommerce zones
        </Button>
      </div>
    </div>
  );
}
