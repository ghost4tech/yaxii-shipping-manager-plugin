import type { AdminBootstrapConfig } from "../bootstrap";
import type {
  ManagedSetupRemovalPreview,
  ProtectedManualZone,
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

function parseRemovalPreview(payload: unknown): ManagedSetupRemovalPreview {
  if (
    !isObject(payload) ||
    typeof payload.woocommerceActive !== "boolean" ||
    payload.removalAvailable !== false ||
    payload.dryRunOnly !== true ||
    !hasNumberCounts(payload) ||
    !Array.isArray(payload.zonesToRemoveLater) ||
    !Array.isArray(payload.methodsToRemoveLater) ||
    !Array.isArray(payload.manualZonesProtected) ||
    typeof payload.requiredConfirmationText !== "string" ||
    typeof payload.message !== "string" ||
    typeof payload.generatedAt !== "string"
  ) {
    throw new Error("Removal preview response did not match the expected contract.");
  }

  if (
    !payload.zonesToRemoveLater.every(isRemovalZoneCandidate) ||
    !payload.methodsToRemoveLater.every(isRemovalMethodCandidate) ||
    !payload.manualZonesProtected.every(isProtectedManualZone)
  ) {
    throw new Error("Removal preview response contained invalid records.");
  }

  return {
    woocommerceActive: payload.woocommerceActive,
    removalAvailable: false,
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
    registryWarnings: stringArray(payload.registryWarnings),
    blockingReasons: stringArray(payload.blockingReasons),
    requiredConfirmationText: payload.requiredConfirmationText,
    message: payload.message,
    generatedAt: payload.generatedAt,
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
