import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  DiagnosticsResponse,
  WilayaDiagnosticStatus,
  ZoneDiagnostic,
} from "@/types/diagnostics";

export function DiagnosticsAdvancedDetails({ response }: { response: DiagnosticsResponse }) {
  return (
    <Card className="px-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border-b-0">
          <AccordionTrigger>Advanced details for support</AccordionTrigger>
          <AccordionContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
              <div className="font-medium">Diagnostic run</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Generated: {response.generatedAt}
              </div>
              {response.warnings.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {response.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
            <WilayaCoverageTable response={response} />
            <ZoneDiagnosticsPanel zones={response.zoneResults} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function WilayaCoverageTable({ response }: { response: DiagnosticsResponse }) {
  return (
    <div>
      <div className="mb-3">
        <div className="text-sm font-medium">Wilaya coverage</div>
        <div className="text-xs text-muted-foreground">
          Matched zone names and status are shown here for agency/support review.
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Code</TableHead>
              <TableHead>Wilaya</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Matched zones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {response.wilayaResults.map((wilaya) => (
              <TableRow key={wilaya.code}>
                <TableCell className="font-mono text-xs">{wilaya.code}</TableCell>
                <TableCell>
                  <div className="font-medium">{wilaya.nameFr}</div>
                  <div className="text-xs text-muted-foreground">{wilaya.nameAr}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={wilaya.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {wilaya.zoneNames.length > 0 ? wilaya.zoneNames.join(", ") : "None"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ZoneDiagnosticsPanel({ zones }: { zones: ZoneDiagnostic[] }) {
  return (
    <div>
      <div className="mb-3">
        <div className="text-sm font-medium">WooCommerce zones</div>
        <div className="text-xs text-muted-foreground">
          Ownership hints are diagnostic signals only. Manual or unknown zones stay protected.
        </div>
      </div>
      <div className="space-y-3">
        {zones.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No WooCommerce shipping zones were returned.
          </div>
        )}
        {zones.map((zone) => (
          <ZoneDiagnosticsCard key={zone.zoneId} zone={zone} />
        ))}
      </div>
    </div>
  );
}

function ZoneDiagnosticsCard({ zone }: { zone: ZoneDiagnostic }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{zone.name}</div>
          <div className="text-xs text-muted-foreground">Zone ID {zone.zoneId}</div>
        </div>
        <Badge variant={ownershipVariant(zone.ownershipHint)}>
          {ownershipLabel(zone.ownershipHint)}
        </Badge>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>Matched records: {zone.matchedWilayaCodes.length}</div>
        <div>Overlapping records: {zone.overlapWilayaCodes.length}</div>
        <div>
          Methods: {zone.enabledMethodCount}/{zone.methodCount} enabled
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {zone.methodCount === 0 && <Badge variant="outline">No methods</Badge>}
        {zone.disabledMethods > 0 && <Badge variant="outline">Disabled methods</Badge>}
        {zone.hasHomeLikeMethod && <Badge variant="outline">Home-like method</Badge>}
        {zone.hasOfficeLikeMethod && <Badge variant="outline">Office-like method</Badge>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: WilayaDiagnosticStatus }) {
  const label =
    status === "configured" ? "Configured" : status === "missing" ? "Missing" : "Conflict";
  const variant =
    status === "configured" ? "default" : status === "missing" ? "secondary" : "destructive";

  return <Badge variant={variant}>{label}</Badge>;
}

function ownershipLabel(hint: ZoneDiagnostic["ownershipHint"]): string {
  if (hint === "managed_registry") {
    return "Yaxii-managed";
  }

  if (hint === "yaxii_hint") {
    return "Yaxii-looking";
  }

  return "Manual or unknown";
}

function ownershipVariant(
  hint: ZoneDiagnostic["ownershipHint"],
): "default" | "outline" | "secondary" {
  if (hint === "managed_registry") {
    return "default";
  }

  return hint === "yaxii_hint" ? "outline" : "secondary";
}
