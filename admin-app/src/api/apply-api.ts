import type { AdminBootstrapConfig } from "../bootstrap";
import type { ApplyRequest, ApplyResponse, ApplyResultZone } from "../types/apply";

export async function fetchApply(
  config: AdminBootstrapConfig,
  request: ApplyRequest,
): Promise<ApplyResponse> {
  const response = await fetch(new URL("apply", ensureTrailingSlash(config.restUrl)), {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-WP-Nonce": config.nonce,
    },
    body: JSON.stringify(request),
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      errorMessageFromPayload(payload, `Apply request failed with HTTP ${response.status}.`),
    );
  }

  return parseApplyResponse(payload);
}

function parseApplyResponse(payload: unknown): ApplyResponse {
  if (
    !isObject(payload) ||
    payload.applyEngineAvailable !== true ||
    typeof payload.applied !== "boolean" ||
    !isApplyResultZones(payload.createdZones) ||
    !isApplyResultZones(payload.skippedZones) ||
    !isApplyResultZones(payload.blockedZones) ||
    !isApplyResultZones(payload.conflicts) ||
    !Array.isArray(payload.warnings) ||
    typeof payload.registryUpdated !== "boolean" ||
    typeof payload.wooCommerceChanged !== "boolean" ||
    typeof payload.previewHash !== "string" ||
    payload.applyContractVersion !== "apply-contract-v1" ||
    typeof payload.message !== "string"
  ) {
    throw new Error("Apply response did not match the expected contract.");
  }

  return {
    applyEngineAvailable: true,
    applied: payload.applied,
    createdZones: payload.createdZones,
    skippedZones: payload.skippedZones,
    blockedZones: payload.blockedZones,
    conflicts: payload.conflicts,
    warnings: payload.warnings.filter((warning): warning is string => typeof warning === "string"),
    registryUpdated: payload.registryUpdated,
    wooCommerceChanged: payload.wooCommerceChanged,
    previewHash: payload.previewHash,
    applyContractVersion: "apply-contract-v1",
    message: payload.message,
  };
}

function isApplyResultZones(zones: unknown): zones is ApplyResultZone[] {
  return Array.isArray(zones) && zones.every(isApplyResultZone);
}

function isApplyResultZone(zone: unknown): zone is ApplyResultZone {
  return isObject(zone);
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
