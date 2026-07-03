import type { DatasetMode } from "./dataset";
import type { OfficeMethodWording, RegionLabelFormat, SetupPath, ZoneNameFormat } from "./settings";

export type ShippingMethodKey = "home_delivery" | "office_delivery" | "custom_1" | "custom_2";

export type ShippingMethodType = "flat_rate";

export type ShippingMethodTemplate = {
  key: ShippingMethodKey;
  enabled: boolean;
  label: string;
  defaultPrice: number | null;
  type: ShippingMethodType;
  locked: boolean;
};

export type PricingMatrixRow = {
  wilayaCode: string;
  enabled: boolean;
  methods: Partial<Record<ShippingMethodKey, number | null>>;
};

export type ZoneNamingTemplate = {
  format: ZoneNameFormat;
  prefix: string;
};

export type ManualZoneProtectionPolicy = {
  protectManualZones: true;
  requirePreviewBeforeApply: true;
  skipConflictsByDefault: true;
  neverDeleteManualZones: true;
};

export type GeneratorDraft = {
  setupPath: SetupPath;
  datasetMode: DatasetMode;
  labelFormat: RegionLabelFormat;
  zoneNaming: ZoneNamingTemplate;
  officeWordingMode: OfficeMethodWording;
  methods: ShippingMethodTemplate[];
  pricingRows: PricingMatrixRow[];
  selectedWilayaCodes: string[];
  manualZoneProtection: ManualZoneProtectionPolicy;
};
