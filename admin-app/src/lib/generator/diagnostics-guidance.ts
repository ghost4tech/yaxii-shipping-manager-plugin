import type { WilayaReference } from "@/components/generator/types";
import type { DiagnosticsResponse } from "@/types/diagnostics";

export type GeneratorRecommendation = {
  title: string;
  description: string;
};

export function generatorRecommendation(
  diagnostics?: DiagnosticsResponse,
): GeneratorRecommendation {
  if (!diagnostics?.woocommerceActive) {
    return {
      title: "Start a new Algeria shipping setup",
      description:
        "WooCommerce diagnostics are unavailable, so preview will verify the store again.",
    };
  }

  const summary = diagnostics.summary;
  if (summary.duplicateConflictCount > 0) {
    return {
      title: "Manual zones need review",
      description: "Manual WooCommerce zones need review. Yaxii will not edit them.",
    };
  }

  if (summary.missingWilayas === 0 && summary.zonesWithoutMethods === 0) {
    return {
      title: "Setup already active",
      description: "Your setup is already active. Use Shipping Zones for daily price changes.",
    };
  }

  if (summary.configuredWilayas === 0 || summary.missingWilayas > summary.configuredWilayas) {
    return {
      title: "Create new setup",
      description: "Start a new Algeria shipping setup for the selected dataset.",
    };
  }

  return {
    title: "Repair existing setup",
    description: "Some wilayas are missing Yaxii-managed zones or methods. Repair them safely.",
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
    if (zone.ownershipHint === "manual_unknown" || zone.enabledMethodCount > 0) {
      return [];
    }

    return zone.matchedWilayaCodes.filter((code) => knownCodes.has(code));
  });

  return Array.from(new Set([...missingCodes, ...methodGapCodes])).sort();
}
