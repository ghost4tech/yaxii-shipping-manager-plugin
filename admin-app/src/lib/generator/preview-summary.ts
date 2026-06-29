import { previewItemTitle } from "@/lib/generator/preview-plan-item";
import type { PreviewPlanItem, PreviewResponse } from "@/types/preview";

export const APPLY_CONFIRMATION_TEXT = "APPLY YAXII SHIPPING PLAN";

export type SetupMode = "fresh" | "continue" | "preview";
export type PreviewTone = "ok" | "warn" | "fail" | "muted";
export type FinalApplyStatus =
  | "ready_to_apply"
  | "ready_to_update_prices"
  | "setup_already_matches"
  | "unsupported_only"
  | "blocked";

export type PreviewGroupSummary = {
  id: keyof PreviewResponse["plan"];
  title: string;
  count: number;
  description: string;
  tone: PreviewTone;
};

export function acceptedPlanSummary(response: PreviewResponse) {
  return {
    selectedWilayas: response.summary.selectedWilayas,
    createZones: response.summary.createZones,
    updateZones: response.summary.updateZones,
    addMethods: response.summary.addMethods,
    updateMethods: response.summary.updateMethods,
    updateMethodStatuses: response.summary.updateMethodStatuses,
    skipManualZones: response.summary.skipManualZones,
    conflicts: response.summary.conflicts,
    warnings: response.summary.warnings,
    unchanged: response.summary.unchanged,
    deleteZones: response.summary.deleteZones,
  };
}

export function canApplyPreview(response: PreviewResponse): boolean {
  return (
    response.canApplyLater &&
    supportedWorkCount(response) > 0 &&
    response.applyReadiness.severity !== "blocked" &&
    response.plan.conflicts.length === 0
  );
}

export function finalApplyStatus(response: PreviewResponse): FinalApplyStatus {
  if (response.summary.conflicts > 0 || response.applyReadiness.severity === "blocked") {
    return "blocked";
  }

  if (response.summary.createZones > 0 || methodAdditionCount(response) > 0) {
    return "ready_to_apply";
  }

  if (response.summary.updateMethods > 0 || response.summary.updateMethodStatuses > 0) {
    return "ready_to_update_prices";
  }

  if (response.summary.updateZones > 0) {
    return "unsupported_only";
  }

  return "setup_already_matches";
}

export function finalStatusMessage(response: PreviewResponse, status: FinalApplyStatus): string {
  if (status === "ready_to_apply") {
    return applyActionDescription(response);
  }

  if (status === "ready_to_update_prices") {
    return "Yaxii will update only managed method prices, labels, or enabled status.";
  }

  if (status === "unsupported_only") {
    return "Zone name updates are previewed for support, but this apply step does not change them.";
  }

  if (status === "blocked") {
    return response.applyReadiness.blockingReasons[0] ?? response.applyReadiness.message;
  }

  return "No supported WooCommerce change is needed for this selection.";
}

export function applyActionDescription(response: PreviewResponse): string {
  const methodsToAdd = methodAdditionCount(response);

  if (response.summary.createZones > 0 && methodsToAdd > 0) {
    return `${response.summary.createZones} zones and ${methodsToAdd} methods can be added now.`;
  }

  if (response.summary.createZones > 0) {
    return `${response.summary.createZones} missing zones can be created now.`;
  }

  if (methodsToAdd > 0) {
    return `${methodsToAdd} missing methods and prices can be added now.`;
  }

  return "Generate the previewed shipping setup with one click.";
}

export function previewGroupSummaries(response: PreviewResponse): PreviewGroupSummary[] {
  return [
    {
      id: "createZones",
      title: "Zones to create",
      count: response.summary.createZones,
      description: groupDescription(response.plan.createZones, "No missing zones."),
      tone: response.summary.createZones > 0 ? "ok" : "muted",
    },
    {
      id: "updateZones",
      title: "Zones to update",
      count: response.summary.updateZones,
      description:
        response.summary.updateZones > 0 ? "Previewed for later support." : "No zone updates.",
      tone: response.summary.updateZones > 0 ? "warn" : "muted",
    },
    {
      id: "addMethods",
      title: "Methods to add",
      count: response.summary.addMethods,
      description: groupDescription(response.plan.addMethods, "No missing methods."),
      tone: response.summary.addMethods > 0 ? "ok" : "muted",
    },
    {
      id: "updateMethods",
      title: "Methods to update",
      count: response.summary.updateMethods + response.summary.updateMethodStatuses,
      description:
        response.summary.updateMethods + response.summary.updateMethodStatuses > 0
          ? "Managed prices, labels, or enabled status."
          : "No managed method changes.",
      tone:
        response.summary.updateMethods + response.summary.updateMethodStatuses > 0 ? "ok" : "muted",
    },
    {
      id: "skipManualZones",
      title: "Manual zones skipped",
      count: response.summary.skipManualZones,
      description:
        response.summary.skipManualZones > 0
          ? "Protected by safety rules."
          : "No manual-zone skips.",
      tone: response.summary.skipManualZones > 0 ? "warn" : "ok",
    },
    {
      id: "conflicts",
      title: "Conflicts",
      count: response.summary.conflicts,
      description:
        response.summary.conflicts > 0 ? "Resolve before applying." : "No conflicts detected.",
      tone: response.summary.conflicts > 0 ? "fail" : "ok",
    },
    {
      id: "warnings",
      title: "Warnings",
      count: response.summary.warnings,
      description: response.summary.warnings > 0 ? "Review before applying." : "No warnings.",
      tone: response.summary.warnings > 0 ? "warn" : "ok",
    },
    {
      id: "unchanged",
      title: "Unchanged",
      count: response.summary.unchanged,
      description:
        response.summary.unchanged > 0
          ? "Already matches the requested setup."
          : "Nothing unchanged in scope.",
      tone: "muted",
    },
  ];
}

export function supportedWorkCount(response: PreviewResponse): number {
  return (
    response.summary.createZones +
    response.summary.addMethods +
    response.summary.updateMethods +
    response.summary.updateMethodStatuses
  );
}

export function methodAdditionCount(response: PreviewResponse): number {
  const createZoneMethodCount = response.plan.createZones.reduce(
    (total, planItem) => total + (planItem.methods?.length ?? 0),
    0,
  );

  return response.summary.addMethods + createZoneMethodCount;
}

function groupDescription(planItems: PreviewPlanItem[], emptyText: string): string {
  const firstPlanItem = planItems[0];
  if (!firstPlanItem) {
    return emptyText;
  }

  const title = previewItemTitle(firstPlanItem);
  const remainingCount = Math.max(planItems.length - 1, 0);
  return remainingCount > 0 ? `${title} (+${remainingCount} more)` : title;
}
