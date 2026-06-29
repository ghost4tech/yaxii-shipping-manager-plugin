import { Activity, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  applyPriceOrLabelUpdatedCount,
  applySkippedCount,
  applyStatusUpdatedCount,
} from "@/lib/generator/apply-summary";
import type { ApplyResponse } from "@/types/apply";

export function GeneratorApplyResult({
  response,
  pendingZoneUpdates,
  onRefreshDiagnostics,
  onDone,
}: {
  response: ApplyResponse;
  pendingZoneUpdates: number;
  onRefreshDiagnostics: () => void;
  onDone: () => void;
}) {
  const skippedCount = applySkippedCount(response);
  const changed = response.applied && response.wooCommerceChanged;

  return (
    <Card className={changed ? "border-emerald-200 bg-emerald-50/70" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {changed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-700" />
          )}
          {changed ? "WooCommerce shipping was updated" : "No WooCommerce change reported"}
        </CardTitle>
        <CardDescription>{response.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          <ResultTile label="Zones created" value={String(response.createdZones.length)} />
          <ResultTile label="Methods added" value={String(response.createdMethods.length)} />
          <ResultTile
            label="Methods updated"
            value={String(applyPriceOrLabelUpdatedCount(response))}
          />
          <ResultTile label="Statuses updated" value={String(applyStatusUpdatedCount(response))} />
          <ResultTile label="Skipped or blocked" value={String(skippedCount)} />
          <ResultTile label="Manual zones" value="Not touched" />
        </div>

        {pendingZoneUpdates > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{pendingZoneUpdates} zone updates remain support-only</AlertTitle>
            <AlertDescription>
              Zone name updates were previewed but not applied in this safe apply step.
            </AlertDescription>
          </Alert>
        )}

        {skippedCount > 0 && (
          <Accordion type="single" collapsible className="rounded-md border border-border px-3">
            <AccordionItem value="skipped" className="border-b-0">
              <AccordionTrigger>Skipped or blocked details</AccordionTrigger>
              <AccordionContent>
                <ApplyResultDetails response={response} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onRefreshDiagnostics}>
            <Activity className="h-4 w-4" />
            Refresh diagnostics
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.assign("admin.php?page=wc-settings&tab=shipping")}
          >
            <ExternalLink className="h-4 w-4" />
            Open WooCommerce zones
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function ApplyResultDetails({ response }: { response: ApplyResponse }) {
  const rows = [
    ...response.skippedZones.map((zone) => zone.reason ?? zone.zoneName ?? "Zone skipped"),
    ...response.skippedMethods.map((method) => method.reason ?? method.title ?? "Method skipped"),
    ...response.skippedMethodUpdates.map(
      (method) => method.reason ?? method.title ?? "Method update skipped",
    ),
    ...response.blockedZones.map((zone) => zone.reason ?? zone.zoneName ?? "Zone blocked"),
    ...response.conflicts.map((zone) => zone.reason ?? zone.zoneName ?? "Conflict"),
    ...response.warnings,
  ];

  return (
    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
      {rows.map((row, rowIndex) => (
        <li key={`${row}-${rowIndex}`}>{row}</li>
      ))}
    </ul>
  );
}
