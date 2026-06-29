import type { MethodDef, Wilaya } from "@/components/generator/types";
import type { ShippingMethodTemplate } from "@/types/generator";
import type { PreviewRequest, PreviewResponse } from "@/types/preview";
import type {
  DiagnosticsLoadState,
  PendingPriceMap,
  PendingStatusMap,
  ReviewContext,
  ShippingZoneRowView,
} from "@/types/shipping-zones";

import {
  pendingChangeCount,
  pendingReviewItems,
  pendingReviewSummary,
  pendingRowMethods,
  pendingRowMethodStatuses,
} from "./pending-changes";
import { buildShippingZoneRows, isShippingMethodKey } from "./status";

export function reviewContextFromPendingChanges(
  wilayas: Wilaya[],
  methodDefs: MethodDef[],
  diagnosticsState: DiagnosticsLoadState,
  pendingPrices: PendingPriceMap,
  pendingStatuses: PendingStatusMap = {},
): ReviewContext | null {
  if (
    diagnosticsState.status !== "ready" ||
    pendingChangeCount(pendingPrices, pendingStatuses) === 0
  ) {
    return null;
  }

  const rows = buildShippingZoneRows(
    wilayas,
    methodDefs,
    diagnosticsState,
    pendingPrices,
    pendingStatuses,
  );
  const changedRows = rows.filter((row) => row.pendingMethodCount > 0);
  if (changedRows.length === 0) {
    return null;
  }

  return {
    request: previewRequestForRows(changedRows, methodDefs, pendingPrices, pendingStatuses),
    previewContext: {
      selectedWilayaCount: changedRows.length,
      communeCoverageSummary: "Wilaya-level WooCommerce shipping zones.",
      enabledMethodLabels: methodDefs.slice(0, 2).map((method) => method.label),
      priceSummary: pendingReviewSummary(
        pendingReviewItems(changedRows, pendingPrices, pendingStatuses),
      ),
      regionFormatLabel: "Default region label",
    },
  };
}

export function repairContextFromRows(
  rows: ShippingZoneRowView[],
  methodDefs: MethodDef[],
): ReviewContext | null {
  const repairRows = rows.filter((row) => row.canRepair);
  if (repairRows.length === 0) {
    return null;
  }

  const supportedMethodDefs = methodDefs.slice(0, 2);

  return {
    request: {
      selectedWilayaCodes: repairRows.map((row) => row.wilaya.code),
      methods: methodTemplatesFromDefs(supportedMethodDefs),
      pricingRows: repairRows.map((row) => ({
        wilayaCode: row.wilaya.code,
        enabled: true,
        methods: repairDefaultPrices(row),
      })),
    },
    previewContext: {
      selectedWilayaCount: repairRows.length,
      communeCoverageSummary: "Wilaya-level WooCommerce shipping zones.",
      enabledMethodLabels: supportedMethodDefs.map((method) => method.label),
      priceSummary: "Repair missing managed setup with current default prices.",
      regionFormatLabel: "Default region label",
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
    updateMethodStatuses: response.summary.updateMethodStatuses,
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
    (response.plan.updateMethods.length > 0 || response.plan.updateMethodStatuses.length > 0) &&
    response.plan.createZones.length === 0 &&
    response.plan.addMethods.length === 0
  );
}

export function previewHasSafeSetupRepair(response: PreviewResponse): boolean {
  return (
    response.canApplyLater &&
    response.applyReadiness.severity !== "blocked" &&
    response.plan.conflicts.length === 0 &&
    (response.plan.createZones.length > 0 || response.plan.addMethods.length > 0)
  );
}

function previewRequestForRows(
  rows: ShippingZoneRowView[],
  methodDefs: MethodDef[],
  pendingPrices: PendingPriceMap,
  pendingStatuses: PendingStatusMap,
): PreviewRequest {
  const supportedMethodDefs = methodDefs.slice(0, 2);

  return {
    selectedWilayaCodes: rows.map((row) => row.wilaya.code),
    methods: methodTemplatesFromDefs(supportedMethodDefs),
    pricingRows: rows.map((row) => ({
      wilayaCode: row.wilaya.code,
      enabled: true,
      methods: pendingRowMethods(row.wilaya, supportedMethodDefs, row.liveZone, pendingPrices),
      methodStatuses: pendingRowMethodStatuses(
        row.wilaya,
        supportedMethodDefs,
        row.liveZone,
        pendingStatuses,
      ),
    })),
  };
}

function repairDefaultPrices(
  row: ShippingZoneRowView,
): Partial<Record<ShippingMethodTemplate["key"], number | null>> {
  return {
    [row.home.key]: row.home.defaultPrice,
    [row.office.key]: row.office.defaultPrice,
  };
}

function hasShippingMethodKey(
  methodDef: MethodDef,
): methodDef is MethodDef & { key: ShippingMethodTemplate["key"] } {
  return isShippingMethodKey(methodDef.key);
}
