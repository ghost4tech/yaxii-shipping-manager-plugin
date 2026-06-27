import type { DatasetMode } from "./dataset";

export type RegionLabelFormat = "fr" | "ar" | "fr_ar" | "ar_fr";

export type ShippingMethodKey = "home_delivery" | "office_delivery" | "custom_1" | "custom_2";

export type ShippingMethodTemplate = {
  key: ShippingMethodKey;
  label: string;
  enabled: boolean;
  defaultPrice: number | null;
};

export type PricingMatrixRow = {
  wilayaCode: string;
  enabled: boolean;
  methods: Partial<Record<ShippingMethodKey, number | null>>;
};

export type ZoneNamingTemplate = {
  format: "{code} - {name_fr}" | "{name_fr}" | "{name_ar}" | "{code} - {name_fr} / {name_ar}";
};

export type ManualZoneProtectionPolicy = {
  skipManualZones: true;
  requirePreviewBeforeApply: true;
};

export type GeneratorDraft = {
  datasetMode: DatasetMode;
  labelFormat: RegionLabelFormat;
  zoneNaming: ZoneNamingTemplate;
  methods: ShippingMethodTemplate[];
  pricingRows: PricingMatrixRow[];
  manualZoneProtection: ManualZoneProtectionPolicy;
};
