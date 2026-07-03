import type { PreviewPlanItem } from "@/types/preview";

export function formatPrice(price: number | null): string {
  return price === null ? "Unset" : `${price} DZD`;
}

export function previewItemTitle(planItem: PreviewPlanItem): string {
  return (
    planItem.message ?? planItem.zoneName ?? planItem.label ?? planItem.wilayaName ?? planItem.type
  );
}

export function previewItemDetails(planItem: PreviewPlanItem): string {
  const detailParts = [
    planItem.reason,
    planItem.location ? `Location ${planItem.location}` : "",
    planItem.zoneNames && planItem.zoneNames.length > 0
      ? `Zones: ${planItem.zoneNames.join(", ")}`
      : "",
    planItem.price !== undefined && planItem.price !== null
      ? `Price ${formatPrice(planItem.price)}`
      : "",
  ];

  return detailParts.filter(Boolean).join(" - ");
}
