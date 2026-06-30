import type { AdminBootstrapConfig } from "../bootstrap";
import type {
  ManagedSetupRemovalPreview,
  ManagedSetupRemovalRequest,
  ManagedSetupRemovalResult,
  OrphanMethodRecord,
  OrphanRegistryRecord,
  ProtectedManualZone,
  RemovalAcceptedSummary,
  RemovalMethodCandidate,
  RemovalZoneCandidate,
} from "../types/managed-setup";

type RemovalPreviewCountPayload = Record<string, unknown> & {
  managedZoneCount: number;
  managedMethodCount: number;
  missingManagedZoneCount: number;
  missingManagedMethodCount: number;
  manualProtectedZoneCount: number;
  registryMismatchCount: number;
};

export async function fetchManagedSetupRemovalPreview(
  config: AdminBootstrapConfig,
): Promise<ManagedSetupRemovalPreview> {
  const response = await fetch(
    new URL("managed-setup/removal-preview", ensureTrailingSlash(config.restUrl)),
    {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "X-WP-Nonce": config.nonce,
      },
    },
  );

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      errorMessageFromPayload(payload, `Removal preview failed with HTTP ${response.status}.`),
    );
  }

  return parseRemovalPreview(payload);
}

export async function removeManagedSetup(
  config: AdminBootstrapConfig,
  request: ManagedSetupRemovalRequest,
): Promise<ManagedSetupRemovalResult> {
  const response = await fetch(
    new URL("managed-setup/remove", ensureTrailingSlash(config.restUrl)),
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-WP-Nonce": config.nonce,
      },
      body: JSON.stringify(request),
    },
  );

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      errorMessageFromPayload(
        payload,
        `Managed setup removal failed with HTTP ${response.status}.`,
      ),
    );
  }

  return parseRemovalResult(payload);
}

function parseRemovalPreview(payload: unknown): ManagedSetupRemovalPreview {
  if (
    !isObject(payload) ||
    typeof payload.woocommerceActive !== "boolean" ||
    typeof payload.removalAvailable !== "boolean" ||
    payload.dryRunOnly !== true ||
    !hasNumberCounts(payload) ||
    !Array.isArray(payload.zonesToRemoveLater) ||
    !Array.isArray(payload.methodsToRemoveLater) ||
    !Array.isArray(payload.manualZonesProtected) ||
    !Array.isArray(payload.orphanRegistryRecords) ||
    !Array.isArray(payload.orphanMethodRecords) ||
    !Array.isArray(payload.blockedZones) ||
    typeof payload.requiredConfirmationText !== "string" ||
    typeof payload.message !== "string" ||
    typeof payload.generatedAt !== "string" ||
    typeof payload.dryRunGeneratedAt !== "string" ||
    typeof payload.dryRunHash !== "string" ||
    !isRemovalAcceptedSummary(payload.acceptedSummary)
  ) {
    throw new Error("Removal preview response did not match the expected contract.");
  }

  if (
    !payload.zonesToRemoveLater.every(isRemovalZoneCandidate) ||
    !payload.methodsToRemoveLater.every(isRemovalMethodCandidate) ||
    !payload.manualZonesProtected.every(isProtectedManualZone) ||
    !payload.orphanRegistryRecords.every(isOrphanRegistryRecord) ||
    !payload.orphanMethodRecords.every(isOrphanMethodRecord) ||
    !payload.blockedZones.every(isRemovalZoneCandidate)
  ) {
    throw new Error("Removal preview response contained invalid records.");
  }

  return {
    woocommerceActive: payload.woocommerceActive,
    removalAvailable: payload.removalAvailable,
    dryRunOnly: true,
    managedZoneCount: payload.managedZoneCount,
    managedMethodCount: payload.managedMethodCount,
    missingManagedZoneCount: payload.missingManagedZoneCount,
    missingManagedMethodCount: payload.missingManagedMethodCount,
    manualProtectedZoneCount: payload.manualProtectedZoneCount,
    registryMismatchCount: payload.registryMismatchCount,
    zonesToRemoveLater: payload.zonesToRemoveLater,
    methodsToRemoveLater: payload.methodsToRemoveLater,
    manualZonesProtected: payload.manualZonesProtected,
    orphanRegistryRecords: payload.orphanRegistryRecords,
    orphanMethodRecords: payload.orphanMethodRecords,
    blockedZones: payload.blockedZones,
    registryWarnings: stringArray(payload.registryWarnings),
    blockingReasons: stringArray(payload.blockingReasons),
    requiredConfirmationText: payload.requiredConfirmationText,
    message: payload.message,
    generatedAt: payload.generatedAt,
    dryRunGeneratedAt: payload.dryRunGeneratedAt,
    dryRunHash: payload.dryRunHash,
    acceptedSummary: payload.acceptedSummary,
  };
}

function parseRemovalResult(payload: unknown): ManagedSetupRemovalResult {
  if (
    !isObject(payload) ||
    typeof payload.removed !== "boolean" ||
    typeof payload.wooCommerceChanged !== "boolean" ||
    !Array.isArray(payload.deletedZones) ||
    typeof payload.deletedMethodsEstimated !== "number" ||
    typeof payload.registryRecordsRemoved !== "number" ||
    typeof payload.orphanRegistryRecordsCleaned !== "number" ||
    !Array.isArray(payload.manualZonesProtected) ||
    !Array.isArray(payload.blockedZones) ||
    typeof payload.message !== "string"
  ) {
    throw new Error("Removal result response did not match the expected contract.");
  }

  if (
    !payload.deletedZones.every(isRemovalZoneCandidate) ||
    !payload.manualZonesProtected.every(isProtectedManualZone) ||
    !payload.blockedZones.every(isRemovalZoneCandidate)
  ) {
    throw new Error("Removal result response contained invalid records.");
  }

  return {
    removed: payload.removed,
    wooCommerceChanged: payload.wooCommerceChanged,
    deletedZones: payload.deletedZones,
    deletedMethodsEstimated: payload.deletedMethodsEstimated,
    registryRecordsRemoved: payload.registryRecordsRemoved,
    orphanRegistryRecordsCleaned: payload.orphanRegistryRecordsCleaned,
    manualZonesProtected: payload.manualZonesProtected,
    blockedZones: payload.blockedZones,
    warnings: stringArray(payload.warnings),
    message: payload.message,
  };
}

function hasNumberCounts(payload: Record<string, unknown>): payload is RemovalPreviewCountPayload {
  return [
    "managedZoneCount",
    "managedMethodCount",
    "missingManagedZoneCount",
    "missingManagedMethodCount",
    "manualProtectedZoneCount",
    "registryMismatchCount",
  ].every((key) => typeof payload[key] === "number");
}

function isRemovalZoneCandidate(value: unknown): value is RemovalZoneCandidate {
  return (
    isObject(value) &&
    typeof value.zoneId === "number" &&
    typeof value.zoneName === "string" &&
    typeof value.registryZoneName === "string" &&
    typeof value.wilayaCode === "string" &&
    typeof value.registryRecordStatus === "string" &&
    typeof value.methodCount === "number" &&
    typeof value.registryOwnedMethodCount === "number" &&
    typeof value.unmanagedMethodCount === "number" &&
    typeof value.canRemove === "boolean" &&
    Array.isArray(value.blockingReasons) &&
    typeof value.recordedMethodCount === "number" &&
    typeof value.liveMethodCount === "number"
  );
}

function isRemovalMethodCandidate(value: unknown): value is RemovalMethodCandidate {
  return (
    isObject(value) &&
    typeof value.zoneId === "number" &&
    typeof value.wilayaCode === "string" &&
    typeof value.methodKey === "string" &&
    typeof value.instanceId === "number" &&
    typeof value.methodId === "string" &&
    typeof value.title === "string" &&
    typeof value.registryTitle === "string" &&
    typeof value.enabled === "boolean" &&
    (typeof value.lastKnownCost === "string" || value.lastKnownCost === null) &&
    (typeof value.currentKnownCost === "string" || value.currentKnownCost === null)
  );
}

function isProtectedManualZone(value: unknown): value is ProtectedManualZone {
  return (
    isObject(value) &&
    typeof value.zoneId === "number" &&
    typeof value.zoneName === "string" &&
    typeof value.methodCount === "number" &&
    Array.isArray(value.locations)
  );
}

function isOrphanRegistryRecord(value: unknown): value is OrphanRegistryRecord {
  return (
    isObject(value) &&
    typeof value.zoneId === "number" &&
    typeof value.wilayaCode === "string" &&
    typeof value.zoneName === "string" &&
    typeof value.reason === "string"
  );
}

function isOrphanMethodRecord(value: unknown): value is OrphanMethodRecord {
  return (
    isObject(value) &&
    typeof value.zoneId === "number" &&
    typeof value.wilayaCode === "string" &&
    typeof value.instanceId === "number" &&
    typeof value.methodKey === "string" &&
    typeof value.reason === "string"
  );
}

function isRemovalAcceptedSummary(value: unknown): value is RemovalAcceptedSummary {
  return (
    isObject(value) &&
    typeof value.managedZoneCount === "number" &&
    typeof value.managedMethodCount === "number" &&
    typeof value.registryMismatchCount === "number" &&
    typeof value.manualProtectedZoneCount === "number"
  );
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function errorMessageFromPayload(payload: unknown, fallback: string): string {
  if (isObject(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  return fallback;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
