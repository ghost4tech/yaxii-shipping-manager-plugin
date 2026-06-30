export type CheckoutFallbackRisk = "low" | "medium" | "high";

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
  warnings: string[];
  generatedAt: string;
};
