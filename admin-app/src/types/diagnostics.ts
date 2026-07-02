export type CheckoutFallbackRisk = "none" | "low" | "medium" | "high";

export type WilayaDiagnosticStatus = "configured" | "missing" | "conflict";

export type ShippingMethodDiagnostic = {
  instanceId: number;
  methodId: string;
  title: string;
  methodTitle: string;
  enabled: boolean;
  cost: string | null;
};

export type ManagedMethodDiagnostic = {
  methodKey: string;
  instanceId: number;
  methodId: string;
  title: string;
  lastKnownCost: string | null;
};

export type ZoneDiagnostic = {
  zoneId: number;
  name: string;
  locations: Array<{
    type: string;
    code: string;
  }>;
  matchedWilayaCodes: string[];
  overlapWilayaCodes: string[];
  ownershipHint: "managed_registry" | "yaxii_hint" | "manual_unknown";
  managedMethods: ManagedMethodDiagnostic[];
  methodCount: number;
  enabledMethodCount: number;
  disabledMethods: number;
  hasHomeLikeMethod: boolean;
  hasOfficeLikeMethod: boolean;
  methods: ShippingMethodDiagnostic[];
};

export type WilayaDiagnostic = {
  code: string;
  nameFr: string;
  nameAr: string;
  status: WilayaDiagnosticStatus;
  zoneIds: number[];
  zoneNames: string[];
};

export type CompatibilityZoneEntry = {
  normalizedWilayaCode: string;
  zoneId: number;
  zoneName: string;
  locationCode: string;
  locationFormat: string;
  sourceFormat: string;
  sourceClassification:
    | "Yaxii Shipping Manager"
    | "Yaxii COD Theme"
    | "External Yaxii zone"
    | "Manual WooCommerce zone";
};

export type CompatibilityWilayaGroup = {
  normalizedWilayaCode: string;
  duplicate: boolean;
  entries: CompatibilityZoneEntry[];
};

export type YaxiiCodCompatibility = {
  yaxiiCodThemeDetected: boolean;
  yaxiiCodThemeActive: boolean;
  yaxiiCodZoneMapDetected: boolean;
  yaxiiCodZoneMapCount: number;
  yaxiiCodZoneCount: number;
  ysmManagedZoneCount: number;
  normalizedDuplicateWilayaCount: number;
  legacyOnlyCoverageDetected: boolean;
  stateFormatMismatchDetected: boolean;
  checkoutCompatibilityRisk: CheckoutFallbackRisk;
  activeTheme: {
    name: string;
    stylesheet: string;
    template: string;
    looksLikeYaxiiCodTheme: boolean;
  };
  zonesByNormalizedWilaya: CompatibilityWilayaGroup[];
  duplicateNormalizedWilayas: string[];
  warnings: string[];
  recommendations: string[];
};

export type DiagnosticsSummary = {
  totalWilayas: number;
  configuredWilayas: number;
  missingWilayas: number;
  managedRegistryZoneCount: number;
  duplicateConflictCount: number;
  zonesWithoutMethods: number;
  checkoutFallbackRisk: CheckoutFallbackRisk;
  recommendedNextAction: string;
  restOfWorldHasMethods: boolean;
};

export type DiagnosticsResponse = {
  woocommerceActive: boolean;
  summary: DiagnosticsSummary;
  wilayaResults: WilayaDiagnostic[];
  zoneResults: ZoneDiagnostic[];
  compatibility: YaxiiCodCompatibility;
  warnings: string[];
  generatedAt: string;
};
