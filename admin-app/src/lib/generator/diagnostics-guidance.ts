import type { WilayaReference } from "@/components/generator/types";
import type { DiagnosticsResponse } from "@/types/diagnostics";

export type GeneratorStartState =
  | "external_review"
  | "fresh_setup"
  | "repair_needed"
  | "setup_active"
  | "manual_review"
  | "diagnostics_unavailable";

export type GeneratorStartGuidance = {
  state: GeneratorStartState;
  title: string;
  message: string;
  manualProtectedZoneCount: number;
  lockedExternalWilayaCount: number;
  safeMissingWilayaCount: number;
};

export function generatorStartGuidance(diagnostics?: DiagnosticsResponse): GeneratorStartGuidance {
  if (!diagnostics?.woocommerceActive) {
    return {
      state: "diagnostics_unavailable",
      title: "Create a new shipping setup",
      message: "WooCommerce diagnostics are unavailable, so preview will verify the store again.",
      manualProtectedZoneCount: 0,
      lockedExternalWilayaCount: 0,
      safeMissingWilayaCount: 0,
    };
  }

  const summary = diagnostics.summary;
  const manualProtectedZoneCount = protectedManualZoneCount(diagnostics);
  const lockedExternalWilayaCount = externalCoveredWilayaCodes(diagnostics).length;
  const safeMissingWilayaCount = safeMissingWilayaCountFromDiagnostics(diagnostics);
  if (hasExternalCompatibilityRisk(diagnostics)) {
    return {
      state: "external_review",
      title: "Existing Yaxii COD setup detected",
      message:
        "This store already has shipping zones created by Yaxii COD Theme. Yaxii Shipping Manager will not create duplicate zones for those wilayas.",
      manualProtectedZoneCount,
      lockedExternalWilayaCount,
      safeMissingWilayaCount,
    };
  }

  if (hasNoManagedSetup(summary, manualProtectedZoneCount)) {
    return {
      state: "fresh_setup",
      title: "Create a new Yaxii setup",
      message:
        manualProtectedZoneCount > 0
          ? "Manual WooCommerce zones exist and will be protected."
          : "No Yaxii-managed zones are recorded. Start setup to create managed WooCommerce zones.",
      manualProtectedZoneCount,
      lockedExternalWilayaCount,
      safeMissingWilayaCount,
    };
  }

  if (summary.duplicateConflictCount > 0 || manualProtectedZoneCount > 0) {
    return {
      state: "manual_review",
      title: "Protected zones need review",
      message:
        "Yaxii found WooCommerce zones it does not manage. Protected zones are read-only and will not be changed.",
      manualProtectedZoneCount,
      lockedExternalWilayaCount,
      safeMissingWilayaCount,
    };
  }

  if (
    summary.configuredWilayas > 0 &&
    summary.missingWilayas === 0 &&
    summary.zonesWithoutMethods === 0
  ) {
    return {
      state: "setup_active",
      title: "Your shipping setup is already active",
      message:
        "Yaxii-managed zones and methods already exist. Use Shipping Editor to change prices or enable/disable methods.",
      manualProtectedZoneCount,
      lockedExternalWilayaCount,
      safeMissingWilayaCount,
    };
  }

  if (summary.configuredWilayas === 0 || summary.missingWilayas >= summary.totalWilayas) {
    return {
      state: "fresh_setup",
      title: "Create new setup",
      message: "Yaxii will create managed WooCommerce zones and methods for selected wilayas.",
      manualProtectedZoneCount,
      lockedExternalWilayaCount,
      safeMissingWilayaCount,
    };
  }

  return {
    state: "repair_needed",
    title: "Repair missing setup",
    message:
      "Some Yaxii-managed zones or methods are missing. Yaxii can repair them safely without touching protected zones.",
    manualProtectedZoneCount,
    lockedExternalWilayaCount,
    safeMissingWilayaCount,
  };
}

export function repairWilayaCodes(
  diagnostics: DiagnosticsResponse | undefined,
  wilayas: WilayaReference[],
): string[] {
  if (!diagnostics?.woocommerceActive) {
    return [];
  }

  const knownCodes = new Set(wilayas.map((wilaya) => wilaya.code));
  const missingCodes = diagnostics.wilayaResults
    .filter((wilaya) => wilaya.status === "missing" && knownCodes.has(wilaya.code))
    .map((wilaya) => wilaya.code);
  const methodGapCodes = diagnostics.zoneResults.flatMap((zone) => {
    if (zone.ownershipHint === "manual_unknown" || !managedZoneHasMethodGap(zone)) {
      return [];
    }

    return zone.matchedWilayaCodes.filter((code) => knownCodes.has(code));
  });

  return Array.from(new Set([...missingCodes, ...methodGapCodes])).sort();
}

export function hasExistingManagedSetup(diagnostics?: DiagnosticsResponse): boolean {
  if (!diagnostics?.woocommerceActive) {
    return false;
  }

  return diagnostics.summary.configuredWilayas > 0;
}

export function hasExternalCompatibilityRisk(diagnostics?: DiagnosticsResponse): boolean {
  if (!diagnostics?.woocommerceActive) {
    return false;
  }

  return (
    diagnostics.compatibility.yaxiiCodThemeDetected &&
    (diagnostics.compatibility.normalizedDuplicateWilayaCount > 0 ||
      diagnostics.compatibility.stateFormatMismatchDetected ||
      externalCoveredWilayaCodes(diagnostics).length > 0)
  );
}

export function externalCoveredWilayaCodes(diagnostics?: DiagnosticsResponse): string[] {
  if (!diagnostics?.woocommerceActive) {
    return [];
  }

  return diagnostics.compatibility.zonesByNormalizedWilaya
    .filter((group) =>
      group.entries.some((entry) =>
        ["Yaxii COD Theme", "External Yaxii zone"].includes(entry.sourceClassification),
      ),
    )
    .map((group) => group.normalizedWilayaCode)
    .sort();
}

export function safeMissingWilayaCodes(
  diagnostics: DiagnosticsResponse | undefined,
  wilayas: WilayaReference[],
): string[] {
  if (!diagnostics?.woocommerceActive) {
    return wilayas.map((wilaya) => wilaya.code);
  }

  const lockedCodes = new Set(externalCoveredWilayaCodes(diagnostics));
  const knownCodes = new Set(wilayas.map((wilaya) => wilaya.code));

  return diagnostics.wilayaResults
    .filter(
      (wilaya) =>
        wilaya.status === "missing" && knownCodes.has(wilaya.code) && !lockedCodes.has(wilaya.code),
    )
    .map((wilaya) => wilaya.code)
    .sort();
}

function protectedManualZoneCount(diagnostics: DiagnosticsResponse): number {
  return diagnostics.zoneResults.filter(
    (zone) =>
      zone.ownershipHint === "manual_unknown" &&
      (zone.matchedWilayaCodes.length > 0 || zone.overlapWilayaCodes.length > 0),
  ).length;
}

function safeMissingWilayaCountFromDiagnostics(diagnostics: DiagnosticsResponse): number {
  const lockedCodes = new Set(externalCoveredWilayaCodes(diagnostics));

  return diagnostics.wilayaResults.filter(
    (wilaya) => wilaya.status === "missing" && !lockedCodes.has(wilaya.code),
  ).length;
}

function hasNoManagedSetup(
  summary: DiagnosticsResponse["summary"],
  manualProtectedZoneCount: number,
): boolean {
  const missingThreshold = Math.max(
    summary.totalWilayas - manualProtectedZoneCount,
    Math.ceil(summary.totalWilayas * 0.8),
  );

  return summary.managedRegistryZoneCount === 0 && summary.missingWilayas >= missingThreshold;
}

function managedZoneHasMethodGap(zone: DiagnosticsResponse["zoneResults"][number]): boolean {
  return (
    zone.ownershipHint === "managed_registry" &&
    (zone.enabledMethodCount === 0 || !zone.hasHomeLikeMethod || !zone.hasOfficeLikeMethod)
  );
}
