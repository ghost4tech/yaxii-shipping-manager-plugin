import { Activity, Lock, ShieldCheck } from "lucide-react";

import type { GeneratorPreviewContext } from "./types";
import type { ApplyReadiness, PreviewPlanItem, PreviewResponse } from "@/types/preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PreviewPlanPanel({
  response,
  context,
  onOpenDiagnostics,
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  onOpenDiagnostics: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>This is a preview only. No WooCommerce changes were made.</AlertTitle>
        <AlertDescription>{response.summary.recommendedAction}</AlertDescription>
      </Alert>

      {context && <PreviewContextPanel context={context} />}

      <ApplyReadinessPanel readiness={response.applyReadiness} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apply confirmation contract</CardTitle>
          <CardDescription>
            Apply will be enabled after the safe apply engine is implemented.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Preview reference</span>
            <Badge variant="outline">{response.previewHash.slice(0, 12)}</Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Preview generated</span>
            <Badge variant="secondary">{response.previewGeneratedAt}</Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Contract version</span>
            <Badge variant="outline">{response.applyContractVersion}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button disabled variant="outline">
              <Lock className="h-4 w-4" />
              Apply disabled
            </Button>
            <Button variant="outline" onClick={onOpenDiagnostics}>
              <Activity className="h-4 w-4" />
              Open diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PreviewStat label="Zones to create" value={String(response.summary.createZones)} />
        <PreviewStat label="Methods to add" value={String(response.summary.addMethods)} />
        <PreviewStat label="Conflicts" value={String(response.summary.conflicts)} tone="warn" />
        <PreviewStat label="Manual skips" value={String(response.summary.skipManualZones)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview plan</CardTitle>
          <CardDescription>{response.canApplyLaterMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreviewPlanGroup
            title="Zones to create"
            emptyLabel="No new zones proposed."
            items={response.plan.createZones}
          />
          <PreviewPlanGroup
            title="Zones to update"
            emptyLabel="No zone updates proposed."
            items={response.plan.updateZones}
          />
          <PreviewPlanGroup
            title="Methods to add"
            emptyLabel="No method additions proposed."
            items={response.plan.addMethods}
          />
          <PreviewPlanGroup
            title="Methods to update"
            emptyLabel="No method updates proposed."
            items={response.plan.updateMethods}
          />
          <PreviewPlanGroup
            title="Manual zones skipped"
            emptyLabel="No manual zones skipped."
            items={response.plan.skipManualZones}
          />
          <PreviewPlanGroup
            title="Conflicts"
            emptyLabel="No conflicts found."
            items={response.plan.conflicts}
          />
          <PreviewPlanGroup
            title="Warnings"
            emptyLabel="No warnings returned."
            items={response.plan.warnings}
          />
          <PreviewPlanGroup
            title="Unchanged"
            emptyLabel="No unchanged wilayas in this preview."
            items={response.plan.unchanged}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewContextPanel({ context }: { context: GeneratorPreviewContext }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Wizard summary</CardTitle>
        <CardDescription>
          The preview used these local draft choices. WooCommerce has not been changed.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm md:grid-cols-2">
        <SummaryLine label="Selected wilayas" value={String(context.selectedWilayaCount)} />
        <SummaryLine label="Commune coverage" value={context.communeCoverageSummary} />
        <SummaryLine
          label="Enabled methods"
          value={
            context.enabledMethodLabels.length > 0
              ? context.enabledMethodLabels.join(", ")
              : "No methods enabled"
          }
        />
        <SummaryLine label="Prices" value={context.priceSummary} />
      </CardContent>
    </Card>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function ApplyReadinessPanel({ readiness }: { readiness: ApplyReadiness }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{readiness.title}</CardTitle>
          <Badge variant={applyReadinessBadgeVariant(readiness.severity)}>
            {applyReadinessSeverityLabel(readiness.severity)}
          </Badge>
        </div>
        <CardDescription>{readiness.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-muted-foreground">{readiness.recommendedAction}</div>
        {readiness.blockingReasons.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <div className="font-medium text-destructive">Blocking reasons</div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
              {readiness.blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <ReadinessCount label="Creates" value={readiness.counts.creates} />
          <ReadinessCount label="Updates" value={readiness.counts.updates} />
          <ReadinessCount label="Manual skips" value={readiness.counts.manualSkips} />
          <ReadinessCount label="Conflicts" value={readiness.counts.conflicts} />
          <ReadinessCount label="Method adds" value={readiness.counts.methodAdditions} />
          <ReadinessCount label="Method updates" value={readiness.counts.methodUpdates} />
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function applyReadinessBadgeVariant(severity: ApplyReadiness["severity"]) {
  if (severity === "blocked") {
    return "destructive";
  }

  return severity === "ready" ? "outline" : "secondary";
}

function applyReadinessSeverityLabel(severity: ApplyReadiness["severity"]): string {
  if (severity === "blocked") {
    return "Blocked";
  }

  return severity === "ready" ? "Ready later" : "Needs review";
}

function PreviewPlanGroup({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: PreviewPlanItem[];
}) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2 p-4">
        {items.length === 0 && <div className="text-sm text-muted-foreground">{emptyLabel}</div>}
        {items.map((item, index) => (
          <PreviewPlanRow
            key={`${item.type}-${item.wilayaCode ?? index}-${item.zoneId ?? index}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewPlanRow({ item }: { item: PreviewPlanItem }) {
  const title = item.message ?? item.zoneName ?? item.label ?? item.wilayaName ?? item.type;
  const details = previewItemDetails(item);

  return (
    <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {item.wilayaCode && <Badge variant="outline">{item.wilayaCode}</Badge>}
        {item.ownershipSource && (
          <Badge variant={item.ownershipSource === "manual_unknown" ? "secondary" : "outline"}>
            {ownershipSourceLabel(item.ownershipSource)}
          </Badge>
        )}
        <span className="font-medium">{title}</span>
      </div>
      {details && <div className="mt-1 text-xs text-muted-foreground">{details}</div>}
    </div>
  );
}

function previewItemDetails(item: PreviewPlanItem): string {
  const details = [
    item.reason,
    item.location ? `Location ${item.location}` : "",
    item.zoneId ? `Zone ID ${item.zoneId}` : "",
    item.methodKey ? `Method ${item.methodKey}` : "",
    item.price !== undefined && item.price !== null ? `Price ${item.price} DZD` : "",
    item.zoneNames && item.zoneNames.length > 0 ? `Zones: ${item.zoneNames.join(", ")}` : "",
    item.ownershipSources && item.ownershipSources.length > 0
      ? `Ownership: ${item.ownershipSources.map(ownershipSourceLabel).join(", ")}`
      : "",
  ];

  return details.filter(Boolean).join(" - ");
}

function ownershipSourceLabel(source: PreviewPlanItem["ownershipSource"]): string {
  if (source === "managed_registry") {
    return "Yaxii managed";
  }

  if (source === "yaxii_name_hint") {
    return "Yaxii-looking";
  }

  return "Manual/unknown";
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className={cn("text-2xl font-semibold", tone === "warn" && "text-amber-600")}>
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
