import type { RegionLabelFormat } from "../types/settings";

export type RegionLabelSource = {
  nameFr: string;
  nameAr: string;
};

export function formatRegionLabel(region: RegionLabelSource, format: RegionLabelFormat): string {
  if (format === "ar") {
    return region.nameAr;
  }

  if (format === "fr_ar") {
    return `${region.nameFr} - ${region.nameAr}`;
  }

  if (format === "ar_fr") {
    return `${region.nameAr} - ${region.nameFr}`;
  }

  return region.nameFr;
}
