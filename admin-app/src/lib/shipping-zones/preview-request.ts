import type { MethodDef, Wilaya } from "@/components/generator/types";
import type { ShippingMethodTemplate } from "@/types/generator";
import type { PreviewRequest, PreviewResponse } from "@/types/preview";
import type {
  DiagnosticsLoadState,
  PendingPriceMap,
  ReviewContext,
  ShippingZoneRowView,
} from "@/types/shipping-zones";

import { pendingPriceCount, pendingReviewPriceSummary, pendingRowMethods } from "./pending-changes";
import { buildShippingZoneRows, isShippingMethodKey } from "./status";

export function reviewContextFromPendingChanges(
  wilayas: Wilaya[],
  methodDefs: MethodDef[],
  diagnosticsState: DiagnosticsLoadState,
  pendingPrices: PendingPriceMap,
): ReviewContext | null {
  if (diagnosticsState.status !== "ready" || pendingPriceCount(pendingPrices) === 0) {
    return null;
  }

  const rows = buildShippingZoneRows(wilayas, methodDefs, diagnosticsState, pendingPrices);
  const changedRows = rows.filter((row) => row.pendingMethodCount > 0);
  if (changedRows.length === 0) {
    return null;
  }

  return {
    request: previewRequestForRows(changedRows, methodDefs, pendingPrices),
    previewContext: {
      selectedWilayaCount: changedRows.length,
      communeCoverageSummary: "Wilaya-level WooCommerce shipping zones.",
      enabledMethodLabels: methodDefs.slice(0, 2).map((method) => method.label),
      priceSummary: pendingReviewPriceSummary(
        changedRows.flatMap((row) =>
          ([row.home, row.office] as const).flatMap((method) =>
            pendingPrices[row.wilaya.code]?.[method.key] === undefined
              ? []
              : [
                  {
                    id: `${row.wilaya.code}-${method.key}`,
                    wilayaCode: row.wilaya.code,
                    wilayaName: row.wilaya.name,
                    methodKey: method.key,
                    methodLabel: method.label,
                    from: method.livePrice,
                    to: pendingPrices[row.wilaya.code]?.[method.key] ?? null,
                  },
                ],
          ),
        ),
      ),
    },
  };
}

export function methodTemplatesFromDefs(methodDefs: MethodDef[]): ShippingMethodTemplate[] {
  return methodDefs.filter(hasShippingMethodKey).map((methodDef) => ({
    key: methodDef.key,
    enabled: true,
    label: methodDef.label,
    defaultPrice: methodDef.defaultPrice,
    type: "flat_rate",
    locked: methodDef.locked,
  }));
}

export function acceptedPlanSummary(response: PreviewResponse) {
  return {
    selectedWilayas: response.summary.selectedWilayas,
    createZones: response.summary.createZones,
    updateZones: response.summary.updateZones,
    addMethods: response.summary.addMethods,
    updateMethods: response.summary.updateMethods,
    skipManualZones: response.summary.skipManualZones,
    conflicts: response.summary.conflicts,
    warnings: response.summary.warnings,
    unchanged: response.summary.unchanged,
    deleteZones: response.summary.deleteZones,
  };
}

export function previewHasOnlySafeMethodUpdates(response: PreviewResponse): boolean {
  return (
    response.canApplyLater &&
    response.applyReadiness.severity !== "blocked" &&
    response.plan.conflicts.length === 0 &&
    response.plan.updateMethods.length > 0 &&
    response.plan.createZones.length === 0 &&
    response.plan.addMethods.length === 0
  );
}

function previewRequestForRows(
  rows: ShippingZoneRowView[],
  methodDefs: MethodDef[],
  pendingPrices: PendingPriceMap,
): PreviewRequest {
  const supportedMethodDefs = methodDefs.slice(0, 2);

  return {
    selectedWilayaCodes: rows.map((row) => row.wilaya.code),
    methods: methodTemplatesFromDefs(supportedMethodDefs),
    pricingRows: rows.map((row) => ({
      wilayaCode: row.wilaya.code,
      enabled: true,
      methods: pendingRowMethods(row.wilaya, supportedMethodDefs, row.liveZone, pendingPrices),
    })),
  };
}

function hasShippingMethodKey(
  methodDef: MethodDef,
): methodDef is MethodDef & { key: ShippingMethodTemplate["key"] } {
  return isShippingMethodKey(methodDef.key);
}
