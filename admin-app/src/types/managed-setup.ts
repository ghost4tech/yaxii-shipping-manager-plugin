export type RemovalZoneCandidate = {
  zoneId: number;
  zoneName: string;
  registryZoneName: string;
  wilayaCode: string;
  recordedMethodCount: number;
  liveMethodCount: number;
};

export type RemovalMethodCandidate = {
  zoneId: number;
  wilayaCode: string;
  methodKey: string;
  instanceId: number;
  methodId: string;
  title: string;
  registryTitle: string;
  enabled: boolean;
  lastKnownCost: string | null;
  currentKnownCost: string | null;
};

export type ProtectedManualZone = {
  zoneId: number;
  zoneName: string;
  methodCount: number;
  locations: Array<{ type: string; code: string }>;
};

export type ManagedSetupRemovalPreview = {
  woocommerceActive: boolean;
  removalAvailable: false;
  dryRunOnly: true;
  managedZoneCount: number;
  managedMethodCount: number;
  missingManagedZoneCount: number;
  missingManagedMethodCount: number;
  manualProtectedZoneCount: number;
  registryMismatchCount: number;
  zonesToRemoveLater: RemovalZoneCandidate[];
  methodsToRemoveLater: RemovalMethodCandidate[];
  manualZonesProtected: ProtectedManualZone[];
  registryWarnings: string[];
  blockingReasons: string[];
  requiredConfirmationText: string;
  message: string;
  generatedAt: string;
};
