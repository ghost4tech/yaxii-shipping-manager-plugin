import type { DiagnosticsResponse, ZoneDiagnostic } from "@/types/diagnostics";

export type DiagnosticsHealthTone = "ok" | "warn" | "fail";

export type DiagnosticsHealthCheck = {
  id: string;
  label: string;
  detail: string;
  status: DiagnosticsHealthTone;
  action?: DiagnosticsHealthAction;
  actionLabel?: string;
};
export type DiagnosticsHealthAction = "shipping_zones" | "generator" | "woocommerce_zones";

export type DiagnosticsHealthSummary = {
  passed: number;
  warnings: number;
  failures: number;
  overallStatus: DiagnosticsHealthTone;
  title: string;
  detail: string;
};

export function diagnosticsHealthChecks(response: DiagnosticsResponse): DiagnosticsHealthCheck[] {
  const protectedZoneCount = protectedManualZoneCount(response.zoneResults);
  const methodIssueCount = methodReviewZoneCount(response.zoneResults);

  return [
    woocommerceHealthCheck(response),
    setupCoverageHealthCheck(response),
    missingSetupHealthCheck(response),
    conflictsHealthCheck(response),
    protectedZonesHealthCheck(protectedZoneCount),
    methodIssuesHealthCheck(methodIssueCount),
    fallbackRiskHealthCheck(response),
    restOfWorldHealthCheck(response),
  ];
}

export function diagnosticsHealthSummary(
  checks: DiagnosticsHealthCheck[],
): DiagnosticsHealthSummary {
  const passed = checks.filter((check) => check.status === "ok").length;
  const warnings = checks.filter((check) => check.status === "warn").length;
  const failures = checks.filter((check) => check.status === "fail").length;
  const overallStatus: DiagnosticsHealthTone = failures > 0 ? "fail" : warnings > 0 ? "warn" : "ok";

  return {
    passed,
    warnings,
    failures,
    overallStatus,
    title: overallStatusTitle(overallStatus),
    detail: overallStatusDetail(overallStatus),
  };
}

export function diagnosticsRecommendedAction(
  response: DiagnosticsResponse,
  summary: DiagnosticsHealthSummary,
): string {
  if (!response.woocommerceActive) {
    return "Activate WooCommerce before reviewing Algeria shipping setup.";
  }

  if (response.summary.duplicateConflictCount > 0) {
    return "Review duplicate shipping-zone conflicts before using Generator preview.";
  }

  if (response.summary.missingWilayas > 0) {
    return "Open Generator to preview a repair for missing Yaxii-managed setup.";
  }

  if (summary.failures > 0) {
    return "Review failed health checks before applying any shipping changes.";
  }

  if (summary.warnings > 0) {
    return "Review the warning, then use Generator preview before applying changes.";
  }

  return "No blocking setup issue was found. Use Shipping Zones for managed prices or Generator for setup previews.";
}

export function protectedManualZoneCount(zones: ZoneDiagnostic[]): number {
  return zones.filter(
    (zone) =>
      zone.ownershipHint === "manual_unknown" &&
      (zone.matchedWilayaCodes.length > 0 || zone.overlapWilayaCodes.length > 0),
  ).length;
}

export function methodReviewZoneCount(zones: ZoneDiagnostic[]): number {
  return zones.filter(zoneNeedsMethodReview).length;
}

function woocommerceHealthCheck(response: DiagnosticsResponse): DiagnosticsHealthCheck {
  return {
    id: "woocommerce",
    label: "WooCommerce status",
    detail: response.woocommerceActive
      ? "WooCommerce is active and diagnostics can read shipping zones."
      : "Activate WooCommerce before reviewing shipping setup.",
    status: response.woocommerceActive ? "ok" : "fail",
  };
}

function setupCoverageHealthCheck(response: DiagnosticsResponse): DiagnosticsHealthCheck {
  const { configuredWilayas, totalWilayas } = response.summary;
  const allConfigured = totalWilayas > 0 && configuredWilayas >= totalWilayas;
  const noneConfigured = response.woocommerceActive && configuredWilayas === 0;

  return {
    id: "coverage",
    label: "Algeria setup coverage",
    detail: `${configuredWilayas} / ${totalWilayas} dataset records currently match WooCommerce zones.`,
    status: allConfigured ? "ok" : noneConfigured ? "fail" : "warn",
  };
}

function missingSetupHealthCheck(response: DiagnosticsResponse): DiagnosticsHealthCheck {
  const missingCount = response.summary.missingWilayas;

  return {
    id: "missing",
    label: "Missing setup",
    detail:
      missingCount === 0
        ? "No missing Algeria setup was found."
        : `${missingCount} records need setup review or repair.`,
    status: missingCount === 0 ? "ok" : "warn",
    action: missingCount === 0 ? undefined : "shipping_zones",
    actionLabel: missingCount === 0 ? undefined : "Open Shipping Zones",
  };
}

function conflictsHealthCheck(response: DiagnosticsResponse): DiagnosticsHealthCheck {
  const conflictCount = response.summary.duplicateConflictCount;

  return {
    id: "conflicts",
    label: "Conflicts",
    detail:
      conflictCount === 0
        ? "No duplicate direct-zone conflicts were found."
        : `${conflictCount} duplicate direct-zone conflicts need review.`,
    status: conflictCount === 0 ? "ok" : "fail",
    action: conflictCount === 0 ? undefined : "woocommerce_zones",
    actionLabel: conflictCount === 0 ? undefined : "Open WooCommerce zones",
  };
}

function protectedZonesHealthCheck(protectedZoneCount: number): DiagnosticsHealthCheck {
  return {
    id: "protected-zones",
    label: "Manual zones",
    detail:
      protectedZoneCount === 0
        ? "No overlapping manual or unknown Algeria zones were found."
        : `${protectedZoneCount} manual or unknown zones are protected from Yaxii writes.`,
    status: protectedZoneCount === 0 ? "ok" : "warn",
    action: protectedZoneCount === 0 ? undefined : "woocommerce_zones",
    actionLabel: protectedZoneCount === 0 ? undefined : "Open WooCommerce zones",
  };
}

function methodIssuesHealthCheck(methodIssueCount: number): DiagnosticsHealthCheck {
  return {
    id: "method-issues",
    label: "Method issues",
    detail:
      methodIssueCount === 0
        ? "No obvious method gaps were found in matched zones."
        : `${methodIssueCount} zones have missing, disabled, or incomplete method signals.`,
    status: methodIssueCount === 0 ? "ok" : "warn",
    action: methodIssueCount === 0 ? undefined : "shipping_zones",
    actionLabel: methodIssueCount === 0 ? undefined : "Open Shipping Zones",
  };
}

function fallbackRiskHealthCheck(response: DiagnosticsResponse): DiagnosticsHealthCheck {
  const risk = response.summary.checkoutFallbackRisk;

  return {
    id: "fallback-risk",
    label: "Checkout fallback risk",
    detail: risk === "low" ? "Fallback risk is low." : `Fallback risk is ${risk}. Review details.`,
    status: risk === "low" ? "ok" : risk === "medium" ? "warn" : "fail",
  };
}

function restOfWorldHealthCheck(response: DiagnosticsResponse): DiagnosticsHealthCheck {
  return {
    id: "rest-of-world",
    label: "Rest-of-world shipping",
    detail: response.summary.restOfWorldHasMethods
      ? "Rest-of-world has shipping methods available."
      : "Rest-of-world has no methods; confirm that this is intentional.",
    status: response.summary.restOfWorldHasMethods ? "ok" : "warn",
    action: response.summary.restOfWorldHasMethods ? undefined : "woocommerce_zones",
    actionLabel: response.summary.restOfWorldHasMethods ? undefined : "Open WooCommerce zones",
  };
}

function zoneNeedsMethodReview(zone: ZoneDiagnostic): boolean {
  return (
    zone.methodCount === 0 ||
    zone.disabledMethods > 0 ||
    !zone.hasHomeLikeMethod ||
    !zone.hasOfficeLikeMethod
  );
}

function overallStatusTitle(status: DiagnosticsHealthTone): string {
  if (status === "ok") {
    return "Shipping health looks good";
  }

  if (status === "warn") {
    return "Shipping setup needs review";
  }

  return "Resolve blocking shipping issues";
}

function overallStatusDetail(status: DiagnosticsHealthTone): string {
  if (status === "ok") {
    return "Diagnostics did not find conflicts or obvious setup gaps.";
  }

  if (status === "warn") {
    return "Yaxii found setup items worth reviewing before applying changes.";
  }

  return "Conflicts or missing requirements should be resolved before applying shipping changes.";
}
