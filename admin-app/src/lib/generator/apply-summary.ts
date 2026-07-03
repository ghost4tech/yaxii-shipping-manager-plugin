import type { ApplyResponse } from "@/types/apply";

export function applySkippedCount(response: ApplyResponse): number {
  return (
    response.skippedZones.length +
    response.skippedMethods.length +
    response.skippedMethodUpdates.length +
    response.blockedZones.length +
    response.conflicts.length
  );
}

export function applyStatusUpdatedCount(response: ApplyResponse): number {
  return response.updatedMethods.filter((method) => method.statusUpdated).length;
}

export function applyPriceOrLabelUpdatedCount(response: ApplyResponse): number {
  return response.updatedMethods.filter((method) => method.priceUpdated || method.titleUpdated)
    .length;
}
