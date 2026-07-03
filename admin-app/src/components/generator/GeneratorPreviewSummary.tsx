import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Info,
  MapPin,
  Package,
  ShieldAlert,
  Tag,
} from "lucide-react";

import type { GeneratorPreviewContext } from "@/components/generator/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ApplyReadinessSeverity, PreviewResponse } from "@/types/preview";

import { finalApplyStatus, type SetupMode } from "@/lib/generator/preview-summary";

export function GeneratorPreviewSummary({
  response,
  context,
  setupMode,
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  setupMode: SetupMode;
}) {
  const finalStatus = finalApplyStatus(response);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">Preview plan</h3>
          <p className="mt-1 text-sm text-muted-foreground">{previewDescription(setupMode)}</p>
        </div>
        <ReadinessBadge severity={response.applyReadiness.severity} />
      </div>

      {finalStatus === "setup_already_matches" && (
        <Alert className="border-emerald-200 bg-emerald-50/60">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <AlertTitle className="text-emerald-900">Setup already matches this selection</AlertTitle>
          <AlertDescription className="text-emerald-800/90">
            No setup changes are needed. Use Shipping Editor for daily price changes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Wilayas selected"
          value={String(response.summary.selectedWilayas)}
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatTile
          label="Coverage"
          value="Wilaya level"
          icon={<Building2 className="h-4 w-4" />}
          details={context?.communeCoverageSummary ?? "Wilaya-level coverage."}
        />
        <StatTile
          label="Methods enabled"
          value={String(context?.enabledMethodLabels.length ?? 0)}
          icon={<Package className="h-4 w-4" />}
        />
        <StatTile
          label="Region format"
          value={context?.regionFormatLabel ?? "Wilaya label"}
          icon={<Tag className="h-4 w-4" />}
        />
      </div>

      {response.summary.conflicts > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Conflicts block apply</AlertTitle>
          <AlertDescription>{response.applyReadiness.message}</AlertDescription>
        </Alert>
      )}

      {response.summary.conflicts === 0 && response.summary.skipManualZones > 0 && (
        <Alert className="border-amber-200 bg-amber-50/60">
          <ShieldAlert className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-900">Protected zones detected</AlertTitle>
          <AlertDescription className="text-amber-800/90">
            {response.summary.skipManualZones} manual, theme, or external zone(s) are protected and
            will be skipped.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ReadinessBadge({ severity }: { severity: ApplyReadinessSeverity }) {
  if (severity === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Ready
      </span>
    );
  }

  if (severity === "attention") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" /> Attention
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
      <Ban className="h-3.5 w-3.5" /> Blocked
    </span>
  );
}

function StatTile({
  label,
  value,
  icon,
  details,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  details?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
          {details && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={`${label} details`}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left">{details}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="mt-1 break-words text-xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function previewDescription(setupMode: SetupMode): string {
  if (setupMode === "preview") {
    return "This is a preview only. No WooCommerce changes will be applied from this mode.";
  }

  return "Review supported WooCommerce changes before applying them.";
}
