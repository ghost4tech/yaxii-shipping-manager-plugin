import type {
  GeneratorDraft,
  ManualZoneProtectionPolicy,
  ShippingMethodTemplate,
} from "../types/generator";
import type {
  DatasetModeOption,
  OfficeMethodWording,
  RegionLabelFormat,
  SafetyRuleKey,
  SelectOption,
  SettingsDraft,
  SetupPath,
  ZoneNameFormat,
} from "../types/settings";

export const DATASET_MODE_OPTIONS: DatasetModeOption[] = [
  {
    mode: "current",
    label: "Current Algeria dataset",
    available: true,
    recommended: true,
  },
  {
    mode: "legacy_58",
    label: "Legacy 58-compatible dataset",
    available: false,
    reason: "Legacy mapping is not available yet.",
  },
];

export const REGION_LABEL_FORMAT_OPTIONS: SelectOption<RegionLabelFormat>[] = [
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
  { value: "fr_ar", label: "French - Arabic" },
  { value: "ar_fr", label: "Arabic - French" },
];

export const ZONE_NAMING_OPTIONS: SelectOption<ZoneNameFormat>[] = [
  { value: "prefix_code_name", label: "{prefix} - {code} {name}" },
  { value: "code_name", label: "{code} - {name}" },
  { value: "name_only", label: "{name}" },
  { value: "prefix_name", label: "{prefix} - {name}" },
];

export const SETUP_PATH_OPTIONS: SelectOption<SetupPath>[] = [
  {
    value: "quick",
    label: "Quick setup",
    description: "Enable all current wilayas with the MVP defaults.",
  },
  {
    value: "manual",
    label: "Manual setup",
    description: "Choose wilayas, labels, methods, and draft prices.",
  },
  {
    value: "csv",
    label: "Import CSV",
    description: "Prepare the CSV path. Backend import is not connected yet.",
  },
];

export const OFFICE_METHOD_WORDING_OPTIONS: SelectOption<OfficeMethodWording>[] = [
  { value: "office_delivery", label: "Office delivery" },
  { value: "stopdesk", label: "Stopdesk" },
  { value: "bureau", label: "Bureau" },
  { value: "custom", label: "Custom label" },
];

export const MANUAL_ZONE_PROTECTION_POLICY: ManualZoneProtectionPolicy = {
  protectManualZones: true,
  requirePreviewBeforeApply: true,
  skipConflictsByDefault: true,
  neverDeleteManualZones: true,
};

export const SAFETY_RULES: Array<{ key: SafetyRuleKey; label: string }> = [
  { key: "protect_manual_zones", label: "Protect manual WooCommerce zones" },
  { key: "require_preview_before_apply", label: "Require preview before apply" },
  { key: "skip_conflicts_by_default", label: "Skip conflicts by default" },
  { key: "never_delete_manual_zones", label: "Never delete manual zones" },
];

export const DEFAULT_SHIPPING_METHOD_TEMPLATES: ShippingMethodTemplate[] = [
  {
    key: "home_delivery",
    enabled: true,
    label: "Home delivery",
    defaultPrice: 700,
    type: "flat_rate",
    locked: true,
  },
  {
    key: "office_delivery",
    enabled: true,
    label: "Office delivery",
    defaultPrice: 400,
    type: "flat_rate",
    locked: true,
  },
  {
    key: "custom_1",
    enabled: false,
    label: "Custom method 1",
    defaultPrice: null,
    type: "flat_rate",
    locked: false,
  },
  {
    key: "custom_2",
    enabled: false,
    label: "Custom method 2",
    defaultPrice: null,
    type: "flat_rate",
    locked: false,
  },
];

export const DEFAULT_SETTINGS_DRAFT: SettingsDraft = {
  datasetMode: "current",
  regionLabelFormat: "fr_ar",
  zoneNameFormat: "prefix_code_name",
  zonePrefix: "Yaxii",
  officeMethodWording: "office_delivery",
};

export const DEFAULT_GENERATOR_DRAFT: GeneratorDraft = {
  setupPath: "quick",
  datasetMode: "current",
  labelFormat: DEFAULT_SETTINGS_DRAFT.regionLabelFormat,
  zoneNaming: {
    format: DEFAULT_SETTINGS_DRAFT.zoneNameFormat,
    prefix: DEFAULT_SETTINGS_DRAFT.zonePrefix,
  },
  officeMethodWording: DEFAULT_SETTINGS_DRAFT.officeMethodWording,
  methods: DEFAULT_SHIPPING_METHOD_TEMPLATES,
  pricingRows: [],
  selectedWilayaCodes: [],
  manualZoneProtection: MANUAL_ZONE_PROTECTION_POLICY,
};

export function officeLabelForWording(wording: OfficeMethodWording, customLabel: string): string {
  if (wording === "custom") {
    return customLabel.trim() || "Office delivery";
  }

  return (
    OFFICE_METHOD_WORDING_OPTIONS.find((option) => option.value === wording)?.label ??
    "Office delivery"
  );
}
