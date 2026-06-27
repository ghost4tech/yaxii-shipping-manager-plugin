import type { AdminBootstrapConfig } from "../bootstrap";
import type {
  DiagnosticsResponse,
  DiagnosticsSummary,
  ShippingMethodDiagnostic,
  WilayaDiagnostic,
  ZoneDiagnostic,
} from "../types/diagnostics";

export async function fetchDiagnostics(config: AdminBootstrapConfig): Promise<DiagnosticsResponse> {
  const response = await fetch(new URL("diagnostics", ensureTrailingSlash(config.restUrl)), {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "X-WP-Nonce": config.nonce,
    },
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      errorMessageFromPayload(payload, `Diagnostics request failed with HTTP ${response.status}.`),
    );
  }

  return parseDiagnosticsResponse(payload);
}

function parseDiagnosticsResponse(payload: unknown): DiagnosticsResponse {
  if (
    !isObject(payload) ||
    typeof payload.woocommerceActive !== "boolean" ||
    !isDiagnosticsSummary(payload.summary) ||
    !Array.isArray(payload.wilayaResults) ||
    !Array.isArray(payload.zoneResults) ||
    typeof payload.generatedAt !== "string"
  ) {
    throw new Error("Diagnostics response did not match the expected contract.");
  }

  const wilayaResults = payload.wilayaResults;
  const zoneResults = payload.zoneResults;

  if (!wilayaResults.every(isWilayaDiagnostic) || !zoneResults.every(isZoneDiagnostic)) {
    throw new Error("Diagnostics response contained invalid result records.");
  }

  return {
    woocommerceActive: payload.woocommerceActive,
    summary: payload.summary,
    wilayaResults,
    zoneResults,
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
    generatedAt: payload.generatedAt,
  };
}

function isDiagnosticsSummary(value: unknown): value is DiagnosticsSummary {
  return (
    isObject(value) &&
    typeof value.totalWilayas === "number" &&
    typeof value.configuredWilayas === "number" &&
    typeof value.missingWilayas === "number" &&
    typeof value.duplicateConflictCount === "number" &&
    typeof value.zonesWithoutMethods === "number" &&
    isFallbackRisk(value.checkoutFallbackRisk) &&
    typeof value.recommendedNextAction === "string" &&
    typeof value.restOfWorldHasMethods === "boolean"
  );
}

function isWilayaDiagnostic(value: unknown): value is WilayaDiagnostic {
  return (
    isObject(value) &&
    typeof value.code === "string" &&
    typeof value.nameFr === "string" &&
    typeof value.nameAr === "string" &&
    isWilayaStatus(value.status) &&
    Array.isArray(value.zoneIds) &&
    Array.isArray(value.zoneNames)
  );
}

function isZoneDiagnostic(value: unknown): value is ZoneDiagnostic {
  return (
    isObject(value) &&
    typeof value.zoneId === "number" &&
    typeof value.name === "string" &&
    Array.isArray(value.locations) &&
    Array.isArray(value.matchedWilayaCodes) &&
    Array.isArray(value.overlapWilayaCodes) &&
    (value.ownershipHint === "yaxii_hint" || value.ownershipHint === "manual_unknown") &&
    typeof value.methodCount === "number" &&
    typeof value.enabledMethodCount === "number" &&
    typeof value.disabledMethods === "number" &&
    typeof value.hasHomeLikeMethod === "boolean" &&
    typeof value.hasOfficeLikeMethod === "boolean" &&
    Array.isArray(value.methods) &&
    value.methods.every(isShippingMethodDiagnostic)
  );
}

function isShippingMethodDiagnostic(value: unknown): value is ShippingMethodDiagnostic {
  return (
    isObject(value) &&
    typeof value.instanceId === "number" &&
    typeof value.methodId === "string" &&
    typeof value.title === "string" &&
    typeof value.methodTitle === "string" &&
    typeof value.enabled === "boolean" &&
    (typeof value.cost === "string" || value.cost === null)
  );
}

function isFallbackRisk(value: unknown): value is DiagnosticsSummary["checkoutFallbackRisk"] {
  return value === "low" || value === "medium" || value === "high";
}

function isWilayaStatus(value: unknown): value is WilayaDiagnostic["status"] {
  return value === "configured" || value === "missing" || value === "conflict";
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
