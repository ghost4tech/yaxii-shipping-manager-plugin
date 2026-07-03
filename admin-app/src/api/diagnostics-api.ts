import type { AdminBootstrapConfig } from "../bootstrap";
import type {
  DiagnosticsResponse,
  YaxiiCodCompatibility,
  CompatibilityWilayaGroup,
  CompatibilityZoneEntry,
  ManagedMethodDiagnostic,
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
    compatibility: isYaxiiCodCompatibility(payload.compatibility)
      ? payload.compatibility
      : emptyCompatibility(),
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
    (value.ownershipHint === "managed_registry" ||
      value.ownershipHint === "yaxii_hint" ||
      value.ownershipHint === "manual_unknown") &&
    Array.isArray(value.managedMethods) &&
    value.managedMethods.every(isManagedMethodDiagnostic) &&
    typeof value.methodCount === "number" &&
    typeof value.enabledMethodCount === "number" &&
    typeof value.disabledMethods === "number" &&
    typeof value.hasHomeLikeMethod === "boolean" &&
    typeof value.hasOfficeLikeMethod === "boolean" &&
    Array.isArray(value.methods) &&
    value.methods.every(isShippingMethodDiagnostic)
  );
}

function isYaxiiCodCompatibility(value: unknown): value is YaxiiCodCompatibility {
  return (
    isObject(value) &&
    typeof value.yaxiiCodThemeDetected === "boolean" &&
    typeof value.yaxiiCodThemeActive === "boolean" &&
    typeof value.yaxiiCodZoneMapDetected === "boolean" &&
    typeof value.yaxiiCodZoneMapCount === "number" &&
    typeof value.yaxiiCodZoneCount === "number" &&
    typeof value.ysmManagedZoneCount === "number" &&
    typeof value.normalizedDuplicateWilayaCount === "number" &&
    typeof value.legacyOnlyCoverageDetected === "boolean" &&
    typeof value.stateFormatMismatchDetected === "boolean" &&
    isFallbackRisk(value.checkoutCompatibilityRisk) &&
    isActiveThemeInfo(value.activeTheme) &&
    Array.isArray(value.zonesByNormalizedWilaya) &&
    value.zonesByNormalizedWilaya.every(isCompatibilityWilayaGroup) &&
    Array.isArray(value.duplicateNormalizedWilayas) &&
    value.duplicateNormalizedWilayas.every((code) => typeof code === "string") &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => typeof warning === "string") &&
    Array.isArray(value.recommendations) &&
    value.recommendations.every((recommendation) => typeof recommendation === "string")
  );
}

function isActiveThemeInfo(value: unknown): value is YaxiiCodCompatibility["activeTheme"] {
  return (
    isObject(value) &&
    typeof value.name === "string" &&
    typeof value.stylesheet === "string" &&
    typeof value.template === "string" &&
    typeof value.looksLikeYaxiiCodTheme === "boolean"
  );
}

function isCompatibilityWilayaGroup(value: unknown): value is CompatibilityWilayaGroup {
  return (
    isObject(value) &&
    typeof value.normalizedWilayaCode === "string" &&
    typeof value.duplicate === "boolean" &&
    Array.isArray(value.entries) &&
    value.entries.every(isCompatibilityZoneEntry)
  );
}

function isCompatibilityZoneEntry(value: unknown): value is CompatibilityZoneEntry {
  return (
    isObject(value) &&
    typeof value.normalizedWilayaCode === "string" &&
    typeof value.zoneId === "number" &&
    typeof value.zoneName === "string" &&
    typeof value.locationCode === "string" &&
    typeof value.locationFormat === "string" &&
    typeof value.sourceFormat === "string" &&
    (value.sourceClassification === "Yaxii Shipping Manager" ||
      value.sourceClassification === "Yaxii COD Theme" ||
      value.sourceClassification === "External Yaxii zone" ||
      value.sourceClassification === "Manual WooCommerce zone")
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

function isManagedMethodDiagnostic(value: unknown): value is ManagedMethodDiagnostic {
  return (
    isObject(value) &&
    typeof value.methodKey === "string" &&
    typeof value.instanceId === "number" &&
    typeof value.methodId === "string" &&
    typeof value.title === "string" &&
    (typeof value.lastKnownCost === "string" || value.lastKnownCost === null)
  );
}

function isFallbackRisk(value: unknown): value is DiagnosticsSummary["checkoutFallbackRisk"] {
  return value === "none" || value === "low" || value === "medium" || value === "high";
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

function emptyCompatibility(): YaxiiCodCompatibility {
  return {
    yaxiiCodThemeDetected: false,
    yaxiiCodThemeActive: false,
    yaxiiCodZoneMapDetected: false,
    yaxiiCodZoneMapCount: 0,
    yaxiiCodZoneCount: 0,
    ysmManagedZoneCount: 0,
    normalizedDuplicateWilayaCount: 0,
    legacyOnlyCoverageDetected: false,
    stateFormatMismatchDetected: false,
    checkoutCompatibilityRisk: "none",
    activeTheme: {
      name: "",
      stylesheet: "",
      template: "",
      looksLikeYaxiiCodTheme: false,
    },
    zonesByNormalizedWilaya: [],
    duplicateNormalizedWilayas: [],
    warnings: [],
    recommendations: [],
  };
}
