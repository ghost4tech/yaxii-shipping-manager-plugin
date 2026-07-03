import type { MethodDef, Wilaya } from "@/components/generator/types";
import type { ShippingMethodKey } from "@/types/generator";
import type {
  LiveZoneSummary,
  PendingChangeItem,
  PendingPriceMap,
  PendingReviewItem,
  PendingStatusChangeItem,
  PendingStatusMap,
  ShippingZoneRowView,
} from "@/types/shipping-zones";

import {
  formatDzdPrice,
  isShippingMethodKey,
  liveMethodEnabledForKey,
  livePriceForKey,
} from "./status";

export function pendingPriceCount(pendingPrices: PendingPriceMap): number {
  return Object.values(pendingPrices).reduce(
    (total, methodPrices) => total + Object.keys(methodPrices).length,
    0,
  );
}

export function pendingStatusCount(pendingStatuses: PendingStatusMap): number {
  return Object.values(pendingStatuses).reduce(
    (total, methodStatuses) => total + Object.keys(methodStatuses).length,
    0,
  );
}

export function pendingChangeCount(
  pendingPrices: PendingPriceMap,
  pendingStatuses: PendingStatusMap,
): number {
  return pendingPriceCount(pendingPrices) + pendingStatusCount(pendingStatuses);
}

export function pendingWilayaCodes(pendingPrices: PendingPriceMap): string[] {
  return Object.entries(pendingPrices)
    .filter(([, methodPrices]) => Object.keys(methodPrices).length > 0)
    .map(([wilayaCode]) => wilayaCode);
}

export function pendingChangeWilayaCodes(
  pendingPrices: PendingPriceMap,
  pendingStatuses: PendingStatusMap,
): string[] {
  return Array.from(
    new Set([...Object.keys(pendingPrices), ...Object.keys(pendingStatuses)]),
  ).filter(
    (wilayaCode) =>
      Object.keys(pendingPrices[wilayaCode] ?? {}).length > 0 ||
      Object.keys(pendingStatuses[wilayaCode] ?? {}).length > 0,
  );
}

export function withPendingPrice(
  pendingPrices: PendingPriceMap,
  wilayaCode: string,
  methodKey: ShippingMethodKey,
  livePrice: number | null,
  pendingPrice: number | null | undefined,
): PendingPriceMap {
  const nextRow = { ...(pendingPrices[wilayaCode] ?? {}) };
  if (pendingPrice === undefined || livePrice === pendingPrice) {
    delete nextRow[methodKey];
  } else {
    nextRow[methodKey] = pendingPrice;
  }

  const nextPrices = { ...pendingPrices };
  if (Object.keys(nextRow).length === 0) {
    delete nextPrices[wilayaCode];
  } else {
    nextPrices[wilayaCode] = nextRow;
  }

  return nextPrices;
}

export function withPendingStatus(
  pendingStatuses: PendingStatusMap,
  wilayaCode: string,
  methodKey: ShippingMethodKey,
  liveEnabled: boolean | null,
  pendingEnabled: boolean | undefined,
): PendingStatusMap {
  const nextRow = { ...(pendingStatuses[wilayaCode] ?? {}) };
  if (pendingEnabled === undefined || liveEnabled === pendingEnabled) {
    delete nextRow[methodKey];
  } else {
    nextRow[methodKey] = pendingEnabled;
  }

  const nextStatuses = { ...pendingStatuses };
  if (Object.keys(nextRow).length === 0) {
    delete nextStatuses[wilayaCode];
  } else {
    nextStatuses[wilayaCode] = nextRow;
  }

  return nextStatuses;
}

export function pendingChangeItems(
  rows: ShippingZoneRowView[],
  pendingPrices: PendingPriceMap,
): PendingChangeItem[] {
  return rows.flatMap((row) =>
    row.methods.flatMap((method) => {
      const pendingPrice = pendingPrices[row.wilaya.code]?.[method.key];
      if (pendingPrice === undefined) {
        return [];
      }

      return [
        {
          id: `${row.wilaya.code}-${method.key}`,
          wilayaCode: row.wilaya.code,
          wilayaName: row.wilaya.name,
          methodKey: method.key,
          methodLabel: method.label,
          from: method.livePrice,
          to: pendingPrice,
        },
      ];
    }),
  );
}

export function pendingStatusChangeItems(
  rows: ShippingZoneRowView[],
  pendingStatuses: PendingStatusMap,
): PendingStatusChangeItem[] {
  return rows.flatMap((row) =>
    row.methods.flatMap((method) => {
      const pendingEnabled = pendingStatuses[row.wilaya.code]?.[method.key];
      if (pendingEnabled === undefined || method.enabled === null) {
        return [];
      }

      return [
        {
          id: `${row.wilaya.code}-${method.key}-status`,
          wilayaCode: row.wilaya.code,
          wilayaName: row.wilaya.name,
          methodKey: method.key,
          methodLabel: method.label,
          from: method.enabled,
          to: pendingEnabled,
        },
      ];
    }),
  );
}

export function pendingReviewItems(
  rows: ShippingZoneRowView[],
  pendingPrices: PendingPriceMap,
  pendingStatuses: PendingStatusMap,
): PendingReviewItem[] {
  return [
    ...pendingChangeItems(rows, pendingPrices).map((change) => ({
      ...change,
      kind: "price" as const,
    })),
    ...pendingStatusChangeItems(rows, pendingStatuses).map((change) => ({
      ...change,
      kind: "status" as const,
    })),
  ];
}

export function pendingReviewPriceSummary(changes: PendingChangeItem[]): string {
  if (changes.length === 0) {
    return "No price changes";
  }

  return changes
    .map(
      (change) =>
        `${change.wilayaCode} ${change.methodLabel}: ${formatDzdPrice(change.from)} to ${formatDzdPrice(
          change.to,
        )}`,
    )
    .join("; ");
}

export function pendingReviewSummary(changes: PendingReviewItem[]): string {
  if (changes.length === 0) {
    return "No changes";
  }

  return changes
    .map((change) => {
      if (change.kind === "status") {
        return `${change.wilayaCode} ${change.methodLabel}: ${statusLabel(change.from)} to ${statusLabel(
          change.to,
        )}`;
      }

      return `${change.wilayaCode} ${change.methodLabel}: ${formatDzdPrice(change.from)} to ${formatDzdPrice(
        change.to,
      )}`;
    })
    .join("; ");
}

export function pendingRowMethods(
  wilaya: Wilaya,
  methodDefs: MethodDef[],
  liveZone: LiveZoneSummary,
  pendingPrices: PendingPriceMap,
): Partial<Record<ShippingMethodKey, number | null>> {
  return Object.fromEntries(
    methodDefs
      .filter(hasShippingMethodKey)
      .map((methodDef) => [
        methodDef.key,
        pendingPrices[wilaya.code]?.[methodDef.key] ?? livePriceForKey(liveZone, methodDef.key),
      ]),
  ) as Partial<Record<ShippingMethodKey, number | null>>;
}

export function pendingRowMethodStatuses(
  wilaya: Wilaya,
  methodDefs: MethodDef[],
  liveZone: LiveZoneSummary,
  pendingStatuses: PendingStatusMap,
): Partial<Record<ShippingMethodKey, boolean>> {
  return Object.fromEntries(
    methodDefs
      .filter(hasShippingMethodKey)
      .map((methodDef) => [
        methodDef.key,
        pendingStatuses[wilaya.code]?.[methodDef.key] ??
          liveMethodEnabledForKey(liveZone, methodDef.key) ??
          true,
      ]),
  ) as Partial<Record<ShippingMethodKey, boolean>>;
}

function statusLabel(enabled: boolean): string {
  return enabled ? "Enabled" : "Disabled";
}

function hasShippingMethodKey(
  methodDef: MethodDef,
): methodDef is MethodDef & { key: ShippingMethodKey } {
  return isShippingMethodKey(methodDef.key);
}
