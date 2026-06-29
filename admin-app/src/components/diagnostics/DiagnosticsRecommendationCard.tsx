import { ExternalLink, Package, RefreshCw, ShieldCheck, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DiagnosticsRecommendationCard({
  recommendation,
  refreshDisabled,
  onRefresh,
  onOpenShippingZones,
  onOpenGenerator,
}: {
  recommendation: string;
  refreshDisabled: boolean;
  onRefresh: () => void;
  onOpenShippingZones: () => void;
  onOpenGenerator: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Recommended next action
        </CardTitle>
        <CardDescription>{recommendation}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onOpenShippingZones}>
          <Package className="h-4 w-4" />
          Open Shipping Zones
        </Button>
        <Button type="button" variant="outline" onClick={onOpenGenerator}>
          <Wand2 className="h-4 w-4" />
          Open Generator
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            window.open("admin.php?page=wc-settings&tab=shipping", "_blank", "noopener")
          }
        >
          <ExternalLink className="h-4 w-4" />
          Open WooCommerce zones
        </Button>
        <Button type="button" onClick={onRefresh} disabled={refreshDisabled}>
          <RefreshCw className={refreshDisabled ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh diagnostics
        </Button>
      </CardContent>
    </Card>
  );
}
