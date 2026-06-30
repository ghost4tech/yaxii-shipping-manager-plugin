import type { WilayaReference } from "@/components/generator/types";
import type { DiagnosticsResponse } from "@/types/diagnostics";

export type GeneratorStartState =
  | "fresh_setup"
  | "repair_needed"
  | "setup_active"
  | "manual_review"
  | "diagnostics_unavailable";

export type GeneratorStartGuidance = {
  state: GeneratorStartState;
  title: string;
  message: string;
};

export function generatorStartGuidance(diagnostics?: DiagnosticsResponse): GeneratorStartGuidance {
  if (!diagnostics?.woocommerceActive) {
    return {
      state: "diagnostics_unavailable",
      title: "Create a new shipping setup",
      message: "WooCommerce diagnostics are unavailable, so preview will verify the store again.",
    };
  }

  const summary = diagnostics.summary;
  if (summary.duplicateConflictCount > 0 || protectedManualZoneCount(diagnostics) > 0) {
    return {
      state: "manual_review",
      title: "Manual zones need review",
      message:
        "Yaxii found WooCommerce zones it does not manage. These zones are protected and will not be changed.",
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
        "Yaxii-managed zones and methods already exist. Use Shipping Zones to change prices or enable/disable methods.",
    };
  }

  if (summary.configuredWilayas === 0 || summary.missingWilayas >= summary.totalWilayas) {
    return {
      state: "fresh_setup",
      title: "Create new setup",
      message: "Yaxii will create managed WooCommerce zones and methods for selected wilayas.",
    };
  }

  return {
    state: "repair_needed",
    title: "Repair missing setup",
    message:
      "Some Yaxii-managed zones or methods are missing. Yaxii can repair them safely without touching manual zones.",
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

function protectedManualZoneCount(diagnostics: DiagnosticsResponse): number {
  return diagnostics.zoneResults.filter(
    (zone) =>
      zone.ownershipHint === "manual_unknown" &&
      (zone.matchedWilayaCodes.length > 0 || zone.overlapWilayaCodes.length > 0),
  ).length;
}

function managedZoneHasMethodGap(zone: DiagnosticsResponse["zoneResults"][number]): boolean {
  return (
    zone.ownershipHint === "managed_registry" &&
    (zone.enabledMethodCount === 0 || !zone.hasHomeLikeMethod || !zone.hasOfficeLikeMethod)
  );
}
