import type { MethodDef, Wilaya } from "@/components/generator/types";
import type { ShippingMethodKey } from "@/types/generator";
import type {
  LiveZoneSummary,
  PendingChangeItem,
  PendingPriceMap,
  ShippingZoneRowView,
} from "@/types/shipping-zones";

import { formatDzdPrice, isShippingMethodKey, livePriceForKey } from "./status";

export function pendingPriceCount(pendingPrices: PendingPriceMap): number {
  return Object.values(pendingPrices).reduce(
    (total, methodPrices) => total + Object.keys(methodPrices).length,
    0,
  );
}

export function pendingWilayaCodes(pendingPrices: PendingPriceMap): string[] {
  return Object.entries(pendingPrices)
    .filter(([, methodPrices]) => Object.keys(methodPrices).length > 0)
    .map(([wilayaCode]) => wilayaCode);
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

export function pendingChangeItems(
  rows: ShippingZoneRowView[],
  pendingPrices: PendingPriceMap,
): PendingChangeItem[] {
  return rows.flatMap((row) =>
    ([row.home, row.office] as const).flatMap((method) => {
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

function hasShippingMethodKey(
  methodDef: MethodDef,
): methodDef is MethodDef & { key: ShippingMethodKey } {
  return isShippingMethodKey(methodDef.key);
}
