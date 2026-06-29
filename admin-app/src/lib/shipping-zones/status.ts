import type { MethodDef, Wilaya } from "@/components/generator/types";
import type { ShippingMethodKey } from "@/types/generator";
import type {
  DiagnosticsLoadState,
  LiveZoneSummary,
  PendingPriceMap,
  PendingStatusMap,
  ShippingZoneFilter,
  ShippingZoneMethodView,
  ShippingZoneRowView,
  ShippingZoneStats,
  ShippingZoneStatus,
} from "@/types/shipping-zones";
import type { ZoneDiagnostic } from "@/types/diagnostics";

export const SHIPPING_ZONE_FILTERS: Array<{ key: ShippingZoneFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending changes" },
  { key: "needs_update", label: "Needs update" },
  { key: "missing", label: "Missing setup" },
  { key: "protected", label: "Protected/manual" },
];

const STATUS_LABELS: Record<ShippingZoneStatus, string> = {
  active: "Active",
  needs_update: "Needs update",
  missing: "Missing setup",
  protected: "Protected manual zone",
  conflict: "Conflict detected",
  checking: "Checking",
  unavailable: "Unavailable",
  not_managed: "Not managed",
};

const FALLBACK_HOME_METHOD: MethodDef = {
  key: "home_delivery",
  label: "Home delivery",
  defaultPrice: 700,
  locked: true,
};

export function buildShippingZoneRows(
  wilayas: Wilaya[],
  methodDefs: MethodDef[],
  diagnosticsState: DiagnosticsLoadState,
  pendingPrices: PendingPriceMap,
  pendingStatuses: PendingStatusMap,
): ShippingZoneRowView[] {
  const displayMethodDefs = shippingZoneMethodDefs(methodDefs, diagnosticsState);

  return wilayas.map((wilaya) => {
    const liveZone = liveStatusForWilaya(wilaya, diagnosticsState, displayMethodDefs);
    const methods = displayMethodDefs.map((methodDef) =>
      methodViewForRow(wilaya, methodDef, liveZone, pendingPrices, pendingStatuses),
    );
    const home =
      methodByKey(methods, "home_delivery") ??
      methods[0] ??
      methodViewForRow(wilaya, FALLBACK_HOME_METHOD, liveZone, pendingPrices, pendingStatuses);
    const office = methodByKey(methods, "office_delivery") ?? methods[1] ?? home;
    const pendingMethodCount =
      Object.keys(pendingPrices[wilaya.code] ?? {}).length +
      Object.keys(pendingStatuses[wilaya.code] ?? {}).length;
    const canRepair = canRepairMissingSetup(liveZone);

    return {
      wilaya,
      liveZone,
      status: liveZone.status,
      statusLabel: STATUS_LABELS[liveZone.status],
      statusMessage: liveZone.message,
      methods,
      home,
      office,
      pendingMethodCount,
      canRepair,
      canSelect: methods.some((method) => method.canEdit || method.canToggleStatus) || canRepair,
    };
  });
}

export function shippingZoneMethodDefs(
  methodDefs: MethodDef[],
  diagnosticsState: DiagnosticsLoadState,
): MethodDef[] {
  if (diagnosticsState.status !== "ready") {
    return methodDefs;
  }

  const methodMap = new Map<string, MethodDef>();
  methodDefs.filter(hasShippingMethodKey).forEach((methodDef) => {
    methodMap.set(methodDef.key, methodDef);
  });

  diagnosticsState.response.zoneResults.forEach((zone) => {
    if (zone.ownershipHint !== "managed_registry") {
      return;
    }

    zone.managedMethods.forEach((managedMethod) => {
      const key = managedMethod.methodKey;
      if (!isShippingMethodKey(key) || methodMap.has(key)) {
        return;
      }

      methodMap.set(key, {
        key,
        label: managedMethod.title || fallbackMethodLabel(key),
        defaultPrice: priceNumberFromCost(managedMethod.lastKnownCost),
        locked: key === "home_delivery" || key === "office_delivery",
      });
    });
  });

  return methodOrder(Array.from(methodMap.values()));
}

export function shippingZoneStats(rows: ShippingZoneRowView[]): ShippingZoneStats {
  return {
    activeWilayas: rows.filter((row) => row.status === "active" || row.status === "needs_update")
      .length,
    managedMethods: rows.reduce(
      (total, row) => total + row.methods.filter((method) => method.canEdit).length,
      0,
    ),
    pendingChanges: rows.reduce((total, row) => total + row.pendingMethodCount, 0),
    protectedManualZones: rows.filter((row) => row.status === "protected").length,
  };
}

export function filterCount(rows: ShippingZoneRowView[], filter: ShippingZoneFilter): number {
  return rows.filter((row) => rowMatchesFilter(row, filter)).length;
}

export function rowMatchesFilter(row: ShippingZoneRowView, filter: ShippingZoneFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "active") {
    return row.status === "active" || row.status === "needs_update";
  }

  if (filter === "pending") {
    return row.pendingMethodCount > 0;
  }

  if (filter === "needs_update") {
    return row.status === "needs_update" || row.pendingMethodCount > 0;
  }

  if (filter === "missing") {
    return row.status === "missing" || row.status === "unavailable";
  }

  return row.status === "protected" || row.status === "conflict" || row.status === "not_managed";
}

export function rowMatchesSearch(row: ShippingZoneRowView, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [row.wilaya.code, row.wilaya.name, row.wilaya.ar].some((value) =>
    value.toLowerCase().includes(query),
  );
}

export function methodKeys(methodDefs: MethodDef[]): ShippingMethodKey[] {
  return methodDefs.map((method) => method.key).filter(isShippingMethodKey);
}

export function isShippingMethodKey(key: string): key is ShippingMethodKey {
  return (
    key === "home_delivery" || key === "office_delivery" || key === "custom_1" || key === "custom_2"
  );
}

export function livePriceForKey(liveZone: LiveZoneSummary, methodKey: ShippingMethodKey) {
  for (const zone of liveZone.zones) {
    if (zone.ownershipHint !== "managed_registry") {
      continue;
    }
    const method = liveMethodForKey(zone, methodKey);
    if (method) {
      return priceNumberFromCost(method.cost);
    }
  }

  return null;
}

export function liveMethodForKey(zone: ZoneDiagnostic, methodKey: ShippingMethodKey) {
  const registryMethod = zone.managedMethods.find((method) => method.methodKey === methodKey);
  if (!registryMethod) {
    return undefined;
  }

  return zone.methods.find((method) => method.instanceId === registryMethod.instanceId);
}

export function liveMethodEnabledForKey(
  liveZone: LiveZoneSummary,
  methodKey: ShippingMethodKey,
): boolean | null {
  for (const zone of liveZone.zones) {
    if (zone.ownershipHint !== "managed_registry") {
      continue;
    }

    const method = liveMethodForKey(zone, methodKey);
    if (method) {
      return method.enabled;
    }
  }

  return null;
}

export function formatDzdPrice(price: number | null): string {
  if (price === null) {
    return "Not set";
  }

  return price === 0 ? "Free" : `${price} DZD`;
}

export function ownershipLabel(ownershipHint: ZoneDiagnostic["ownershipHint"]): string {
  if (ownershipHint === "managed_registry") {
    return "Managed by Yaxii";
  }

  if (ownershipHint === "manual_unknown") {
    return "Manual zone protected";
  }

  return "Name match only";
}

function methodViewForRow(
  wilaya: Wilaya,
  methodDef: MethodDef | undefined,
  liveZone: LiveZoneSummary,
  pendingPrices: PendingPriceMap,
  pendingStatuses: PendingStatusMap,
): ShippingZoneMethodView {
  const key = methodDef && isShippingMethodKey(methodDef.key) ? methodDef.key : "home_delivery";
  const livePrice = livePriceForKey(liveZone, key);
  const enabled = liveMethodEnabledForKey(liveZone, key);
  const canEdit = canEditManagedMethod(liveZone, key);
  const canToggleStatus = canToggleManagedMethod(liveZone, key);

  return {
    key,
    label: methodDef?.label ?? key,
    livePrice,
    pendingPrice: pendingPrices[wilaya.code]?.[key],
    defaultPrice: methodDef?.defaultPrice ?? null,
    enabled,
    pendingEnabled: pendingStatuses[wilaya.code]?.[key],
    canEdit,
    canToggleStatus,
    disabledReason: canEdit
      ? undefined
      : enabled === false
        ? "Disabled"
        : disabledReasonForStatus(liveZone.status),
  };
}

function disabledReasonForStatus(status: ShippingZoneStatus): string {
  if (status === "protected" || status === "conflict" || status === "not_managed") {
    return "Protected manual zone";
  }

  if (status === "missing") {
    return "Missing setup";
  }

  if (status === "checking") {
    return "Checking";
  }

  return "Not managed";
}

function canEditManagedMethod(liveZone: LiveZoneSummary, methodKey: ShippingMethodKey): boolean {
  if (liveZone.status !== "active" && liveZone.status !== "needs_update") {
    return false;
  }

  return liveZone.zones.some(
    (zone) =>
      zone.ownershipHint === "managed_registry" &&
      liveMethodForKey(zone, methodKey)?.enabled === true,
  );
}

function canToggleManagedMethod(liveZone: LiveZoneSummary, methodKey: ShippingMethodKey): boolean {
  if (liveZone.status !== "active" && liveZone.status !== "needs_update") {
    return false;
  }

  return liveZone.zones.some(
    (zone) =>
      zone.ownershipHint === "managed_registry" && Boolean(liveMethodForKey(zone, methodKey)),
  );
}

function canRepairMissingSetup(liveZone: LiveZoneSummary): boolean {
  return liveZone.status === "missing";
}

function liveStatusForWilaya(
  wilaya: Wilaya,
  diagnosticsState: DiagnosticsLoadState,
  methodDefs: MethodDef[],
): LiveZoneSummary {
  if (diagnosticsState.status === "waiting" || diagnosticsState.status === "loading") {
    return { status: "checking", message: "Reading WooCommerce", zones: [] };
  }

  if (diagnosticsState.status === "error") {
    return { status: "unavailable", message: "Diagnostics unavailable", zones: [] };
  }

  if (!diagnosticsState.response.woocommerceActive) {
    return { status: "unavailable", message: "WooCommerce inactive", zones: [] };
  }

  const result = diagnosticsState.response.wilayaResults.find((item) => item.code === wilaya.code);
  const zones = result
    ? diagnosticsState.response.zoneResults.filter((zone) => result.zoneIds.includes(zone.zoneId))
    : [];

  if (!result || result.status === "missing") {
    return { status: "missing", message: "Missing setup", zones };
  }

  if (result.status === "conflict") {
    return {
      status: "conflict",
      message: zones.some((zone) => zone.ownershipHint === "manual_unknown")
        ? "Manual WooCommerce zone detected"
        : "Duplicate WooCommerce zones detected",
      zones,
    };
  }

  const [zone] = zones;
  if (!zone) {
    return { status: "unavailable", message: "Zone details unavailable", zones };
  }

  if (zone.ownershipHint === "manual_unknown") {
    return { status: "protected", message: "Protected manual zone", zones };
  }

  if (zone.ownershipHint !== "managed_registry") {
    return { status: "not_managed", message: "Name match only", zones };
  }

  if (!hasRequiredManagedMethods(zone, methodDefs)) {
    return { status: "missing", message: "Missing managed methods", zones };
  }

  if (hasDraftPriceDifference(wilaya, zone, methodDefs)) {
    return { status: "needs_update", message: "Saved defaults differ from WooCommerce", zones };
  }

  return { status: "active", message: "Managed by Yaxii", zones };
}

function hasDraftPriceDifference(
  wilaya: Wilaya,
  zone: ZoneDiagnostic,
  methodDefs: MethodDef[],
): boolean {
  return methodDefs.some((methodDef) => {
    if (!isShippingMethodKey(methodDef.key)) {
      return false;
    }

    const draftMethod = wilaya.methods[methodDef.key];
    const liveMethod = liveMethodForKey(zone, methodDef.key);
    if (!draftMethod || !liveMethod || !draftMethod.enabled) {
      return false;
    }

    return normalizedPrice(draftMethod.price) !== normalizedPrice(liveMethod.cost);
  });
}

function priceNumberFromCost(cost: string | null): number | null {
  if (cost === null || cost.trim() === "") {
    return null;
  }

  const price = Number(cost);
  return Number.isFinite(price) ? price : null;
}

function normalizedPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : String(value);
}

function hasRequiredManagedMethods(zone: ZoneDiagnostic, methodDefs: MethodDef[]): boolean {
  const requiredKeys = methodDefs.map((methodDef) => methodDef.key).filter(isShippingMethodKey);
  if (requiredKeys.length === 0) {
    return zone.hasHomeLikeMethod && zone.hasOfficeLikeMethod;
  }

  return requiredKeys.every((methodKey) => Boolean(liveMethodForKey(zone, methodKey)));
}

function hasShippingMethodKey(
  methodDef: MethodDef,
): methodDef is MethodDef & { key: ShippingMethodKey } {
  return isShippingMethodKey(methodDef.key);
}

function methodByKey(methods: ShippingZoneMethodView[], key: ShippingMethodKey) {
  return methods.find((method) => method.key === key);
}

function methodOrder(methodDefs: MethodDef[]): MethodDef[] {
  const order: Record<ShippingMethodKey, number> = {
    home_delivery: 0,
    office_delivery: 1,
    custom_1: 2,
    custom_2: 3,
  };

  return [...methodDefs].sort((first, second) => {
    const firstOrder = isShippingMethodKey(first.key) ? order[first.key] : 99;
    const secondOrder = isShippingMethodKey(second.key) ? order[second.key] : 99;
    return firstOrder - secondOrder;
  });
}

function fallbackMethodLabel(key: ShippingMethodKey): string {
  if (key === "home_delivery") {
    return "Home delivery";
  }

  if (key === "office_delivery") {
    return "Office delivery";
  }

  return key === "custom_1" ? "Custom method 1" : "Custom method 2";
}
