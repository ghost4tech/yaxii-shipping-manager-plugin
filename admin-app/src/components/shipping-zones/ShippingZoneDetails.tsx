import { Activity, Check, ExternalLink, X } from "lucide-react";

import { ownershipLabel, formatDzdPrice, liveMethodForKey } from "@/lib/shipping-zones/status";
import { cn } from "@/lib/utils";
import type { ShippingZoneRowView } from "@/types/shipping-zones";

export function ShippingZoneDetails({
  row,
  onOpenDiagnostics,
  onOpenWooCommerceZones,
}: {
  row: ShippingZoneRowView;
  onOpenDiagnostics: () => void;
  onOpenWooCommerceZones: () => void;
}) {
  if (row.liveZone.zones.length === 0) {
    return (
      <div className="mx-4 mb-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <ReadOnlyStatusNote row={row} />
        <ExternalCompatibilityDetails row={row} />
        {row.status === "missing"
          ? "This wilaya is missing its Yaxii-managed WooCommerce setup."
          : "No WooCommerce zone is currently matched to this wilaya."}
        {readOnlyExternalStatus(row.status) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButtons
              onOpenDiagnostics={onOpenDiagnostics}
              onOpenWooCommerceZones={onOpenWooCommerceZones}
            />
          </div>
        )}
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
          This manual WooCommerce zone is read-only in Yaxii Shipping Manager. It can be reviewed in
          Diagnostics or managed from WooCommerce zones.
        </div>
      )}
      {row.status === "not_managed" && (
        <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
          This zone is not managed by Yaxii. Yaxii will not edit it.
        </div>
      )}
      <ReadOnlyStatusNote row={row} />
      {row.status === "updating" && (
        <div className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sky-900">
          Update sent. Refreshing WooCommerce diagnostics before showing the final status.
        </div>
      )}
      <ExternalCompatibilityDetails row={row} />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {row.liveZone.zones.map((zone) => (
          <div key={zone.zoneId} className="space-y-2">
            <div className="font-medium text-foreground/80">{zone.name}</div>
            <DetailLine label={`Matched wilaya: ${matchedWilayaLabel(row, zone)}`} ok />
            <DetailLine label={ownershipLabel(zone.ownershipHint)} ok />
            <DetailLine label="WooCommerce zone exists" ok />
            {zone.ownershipHint === "manual_unknown"
              ? zone.methods.map((method) => (
                  <DetailLine
                    key={method.instanceId}
                    label={`${method.title || method.methodTitle}: ${formatMethodCost(
                      method.cost,
                    )} - ${method.enabled ? "Enabled" : "Disabled"}`}
                    ok={method.enabled}
                  />
                ))
              : row.methods.map((method) => (
                  <DetailLine
                    key={method.key}
                    label={`${method.label}: ${formatDzdPrice(
                      liveMethodForKey(zone, method.key) ? method.livePrice : null,
                    )}`}
                    ok={Boolean(liveMethodForKey(zone, method.key))}
                  />
                ))}
            {zone.ownershipHint === "manual_unknown" && zone.methods.length === 0 && (
              <DetailLine label="No shipping methods found in this zone" ok={false} />
            )}
          </div>
        ))}
      </div>
      {(row.status === "protected" ||
        row.status === "not_managed" ||
        row.status === "conflict" ||
        readOnlyExternalStatus(row.status)) && (
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButtons
            onOpenDiagnostics={onOpenDiagnostics}
            onOpenWooCommerceZones={onOpenWooCommerceZones}
          />
        </div>
      )}
    </div>
  );
}

function ReadOnlyStatusNote({ row }: { row: ShippingZoneRowView }) {
  if (row.status === "duplicate_external") {
    return (
      <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
        This wilaya is covered by both Yaxii Shipping Manager and Yaxii COD Theme.
      </div>
    );
  }

  if (row.status === "yaxii_cod_theme") {
    return (
      <div className="mb-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sky-900">
        This wilaya is already covered by Yaxii COD Theme. Yaxii Shipping Manager will not create a
        duplicate zone.
      </div>
    );
  }

  if (row.status === "external_yaxii") {
    return (
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800">
        This wilaya is covered by an external Yaxii-looking zone. Yaxii Shipping Manager will not
        edit it.
      </div>
    );
  }

  return null;
}

function ExternalCompatibilityDetails({ row }: { row: ShippingZoneRowView }) {
  const entries = row.liveZone.externalEntries ?? [];
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 grid gap-2 md:grid-cols-2">
      {entries.map((entry) => (
        <div
          key={`${entry.normalizedWilayaCode}-${entry.zoneId}-${entry.sourceFormat}`}
          className="rounded-md border border-border bg-card/70 p-3"
        >
          <div className="font-medium text-foreground/80">{entry.sourceClassification}</div>
          <DetailLine label={`Zone ID: ${entry.zoneId || "unavailable"}`} ok={entry.zoneId > 0} />
          <DetailLine
            label={`Zone name: ${entry.zoneName || "unavailable"}`}
            ok={Boolean(entry.zoneName)}
          />
          <DetailLine label={`Location format: ${entry.locationCode}`} ok />
          <DetailLine
            label={`Method count: ${entry.methodCount ?? 0}`}
            ok={(entry.methodCount ?? 0) > 0}
          />
        </div>
      ))}
    </div>
  );
}

function ActionButtons({
  onOpenDiagnostics,
  onOpenWooCommerceZones,
}: {
  onOpenDiagnostics: () => void;
  onOpenWooCommerceZones: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpenWooCommerceZones}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-muted"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Open WooCommerce zones
      </button>
      <button
        type="button"
        onClick={onOpenDiagnostics}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-muted"
      >
        <Activity className="h-3.5 w-3.5" />
        Review Diagnostics
      </button>
    </>
  );
}

function readOnlyExternalStatus(status: ShippingZoneRowView["status"]): boolean {
  return (
    status === "yaxii_cod_theme" || status === "external_yaxii" || status === "duplicate_external"
  );
}

function matchedWilayaLabel(
  row: ShippingZoneRowView,
  zone: ShippingZoneRowView["liveZone"]["zones"][number],
): string {
  const matchedCodes =
    zone.matchedWilayaCodes.length > 0 ? zone.matchedWilayaCodes : [row.wilaya.code];
  return matchedCodes.join(", ");
}

function formatMethodCost(cost: string | null): string {
  if (cost === null || cost.trim() === "") {
    return "Not set";
  }

  const numericCost = Number(cost);
  return Number.isFinite(numericCost) ? formatDzdPrice(numericCost) : cost;
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
