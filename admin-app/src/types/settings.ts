import type { DatasetMode } from "./dataset";
import type { ManualZoneProtectionPolicy, ShippingMethodTemplate } from "./generator";

export type SetupPath = "quick" | "manual" | "csv";

export type RegionLabelFormat = "fr" | "ar" | "fr_ar" | "ar_fr";

export type ZoneNameFormat = "prefix_code_name" | "code_name" | "name_only" | "prefix_name";

export type OfficeMethodWording = "office_delivery" | "stopdesk" | "bureau" | "custom";

export type SafetyRuleKey =
  | "protect_manual_zones"
  | "require_preview_before_apply"
  | "skip_conflicts_by_default"
  | "never_delete_manual_zones";

export type DatasetModeOption = {
  mode: DatasetMode;
  label: string;
  available: boolean;
  reason?: string;
  recommended?: boolean;
};

export type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
};

export type PersistedSettings = {
  datasetMode: DatasetMode;
  regionLabelFormat: RegionLabelFormat;
  zoneNameFormat: ZoneNameFormat;
  zonePrefix: string;
  officeWordingMode: OfficeMethodWording;
  officeCustomLabel: string;
  methods: ShippingMethodTemplate[];
  safetyPolicy: ManualZoneProtectionPolicy;
};

export type SettingsOptionsMetadata = {
  optionName: string;
  datasetModes: DatasetMode[];
  availableModes: DatasetMode[];
  regionLabelFormats: RegionLabelFormat[];
  zoneNameFormats: ZoneNameFormat[];
  officeWordingModes: OfficeMethodWording[];
  methodKeys: string[];
  methodType: "flat_rate";
  currency: {
    editable: false;
    fallback: "DZD";
  };
};

export type SettingsResponse = {
  settings: PersistedSettings;
  defaults: PersistedSettings;
  options: SettingsOptionsMetadata;
  warnings: string[];
};
