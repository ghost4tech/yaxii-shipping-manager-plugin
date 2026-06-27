import type { ShippingMethodKey, ShippingMethodTemplate } from "./generator";
import type { RegionLabelFormat, ZoneNameFormat } from "./settings";

export type PreviewOwnershipSource = "managed_registry" | "yaxii_name_hint" | "manual_unknown";

export type PreviewRequest = {
  selectedWilayaCodes?: string[];
  pricingRows?: Array<{
    wilayaCode: string;
    enabled: boolean;
    methods: Partial<Record<ShippingMethodKey, number | null>>;
  }>;
  methods?: ShippingMethodTemplate[];
  zoneNameFormat?: ZoneNameFormat;
  zonePrefix?: string;
  regionLabelFormat?: RegionLabelFormat;
};

export type PreviewPlanItem = {
  type: string;
  wilayaCode?: string;
  wilayaName?: string;
  zoneId?: number;
  zoneIds?: number[];
  zoneName?: string;
  zoneNames?: string[];
  currentName?: string;
  location?: string;
  methodKey?: ShippingMethodKey;
  label?: string;
  price?: number | null;
  methods?: Array<{
    key: string;
    label: string;
    price: number | null;
  }>;
  ownershipSource?: PreviewOwnershipSource;
  ownershipSources?: PreviewOwnershipSource[];
  reason?: string;
  message?: string;
};

export type PreviewPlanGroups = {
  createZones: PreviewPlanItem[];
  updateZones: PreviewPlanItem[];
  addMethods: PreviewPlanItem[];
  updateMethods: PreviewPlanItem[];
  skipManualZones: PreviewPlanItem[];
  conflicts: PreviewPlanItem[];
  warnings: PreviewPlanItem[];
  unchanged: PreviewPlanItem[];
};

export type PreviewSummary = {
  selectedWilayas: number;
  createZones: number;
  updateZones: number;
  addMethods: number;
  updateMethods: number;
  skipManualZones: number;
  conflicts: number;
  warnings: number;
  unchanged: number;
  deleteZones: 0;
  recommendedAction: string;
};

export type PreviewResponse = {
  summary: PreviewSummary;
  plan: PreviewPlanGroups;
  warnings: string[];
  generatedAt: string;
  safetyPolicy: {
    protectManualZones: true;
    requirePreviewBeforeApply: true;
    skipConflictsByDefault: true;
    neverDeleteManualZones: true;
  };
  canApplyLater: false;
  canApplyLaterMessage: string;
};
