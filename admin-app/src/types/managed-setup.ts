export type RemovalZoneCandidate = {
  zoneId: number;
  zoneName: string;
  registryZoneName: string;
  wilayaCode: string;
  registryRecordStatus: string;
  methodCount: number;
  registryOwnedMethodCount: number;
  unmanagedMethodCount: number;
  canRemove: boolean;
  blockingReasons: string[];
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

export type OrphanRegistryRecord = {
  zoneId: number;
  wilayaCode: string;
  zoneName: string;
  reason: string;
};

export type OrphanMethodRecord = {
  zoneId: number;
  wilayaCode: string;
  instanceId: number;
  methodKey: string;
  reason: string;
};

export type RemovalAcceptedSummary = {
  managedZoneCount: number;
  managedMethodCount: number;
  registryMismatchCount: number;
  manualProtectedZoneCount: number;
};

export type ManagedSetupRemovalPreview = {
  woocommerceActive: boolean;
  removalAvailable: boolean;
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
  orphanRegistryRecords: OrphanRegistryRecord[];
  orphanMethodRecords: OrphanMethodRecord[];
  blockedZones: RemovalZoneCandidate[];
  registryWarnings: string[];
  blockingReasons: string[];
  requiredConfirmationText: string;
  message: string;
  generatedAt: string;
  dryRunGeneratedAt: string;
  dryRunHash: string;
  acceptedSummary: RemovalAcceptedSummary;
};

export type ManagedSetupRemovalRequest = {
  confirmed: true;
  confirmationText: string;
  dryRunHash: string;
  dryRunGeneratedAt: string;
  acceptedSummary: RemovalAcceptedSummary;
};

export type ManagedSetupRemovalResult = {
  removed: boolean;
  wooCommerceChanged: boolean;
  deletedZones: RemovalZoneCandidate[];
  deletedMethodsEstimated: number;
  registryRecordsRemoved: number;
  orphanRegistryRecordsCleaned: number;
  manualZonesProtected: ProtectedManualZone[];
  blockedZones: RemovalZoneCandidate[];
  warnings: string[];
  message: string;
};
