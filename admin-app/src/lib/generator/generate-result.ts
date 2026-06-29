import {
  applyPriceOrLabelUpdatedCount,
  applySkippedCount,
  applyStatusUpdatedCount,
} from "@/lib/generator/apply-summary";
import type { ApplyResponse } from "@/types/apply";

export function applyResultMessage(response: ApplyResponse): string {
  const skippedCount = applySkippedCount(response);
  const updatedCount = applyPriceOrLabelUpdatedCount(response) + applyStatusUpdatedCount(response);

  if (!response.applied || !response.wooCommerceChanged) {
    return response.message || "The reviewed preview did not require a WooCommerce change.";
  }

  const resultParts = [
    `${response.createdZones.length} zones created`,
    `${response.createdMethods.length} methods added`,
    `${updatedCount} methods updated`,
    `${skippedCount} skipped or blocked`,
  ];

  return resultParts.join(" - ");
}
