import type { AdminBootstrapConfig } from "../bootstrap";
import type {
  PreviewPlanGroups,
  PreviewPlanItem,
  PreviewRequest,
  PreviewResponse,
  PreviewSummary,
} from "../types/preview";

export async function fetchPreview(
  config: AdminBootstrapConfig,
  request: PreviewRequest,
): Promise<PreviewResponse> {
  const response = await fetch(new URL("preview", ensureTrailingSlash(config.restUrl)), {
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
      errorMessageFromPayload(payload, `Preview request failed with HTTP ${response.status}.`),
    );
  }

  return parsePreviewResponse(payload);
}

function parsePreviewResponse(payload: unknown): PreviewResponse {
  if (
    !isObject(payload) ||
    !isPreviewSummary(payload.summary) ||
    !isPreviewPlanGroups(payload.plan) ||
    !Array.isArray(payload.warnings) ||
    typeof payload.generatedAt !== "string" ||
    !isObject(payload.safetyPolicy) ||
    payload.canApplyLater !== false ||
    typeof payload.canApplyLaterMessage !== "string"
  ) {
    throw new Error("Preview response did not match the expected contract.");
  }

  return {
    summary: payload.summary,
    plan: payload.plan,
    warnings: payload.warnings.filter((warning): warning is string => typeof warning === "string"),
    generatedAt: payload.generatedAt,
    safetyPolicy: payload.safetyPolicy as PreviewResponse["safetyPolicy"],
    canApplyLater: false,
    canApplyLaterMessage: payload.canApplyLaterMessage,
  };
}

function isPreviewSummary(summary: unknown): summary is PreviewSummary {
  return (
    isObject(summary) &&
    typeof summary.selectedWilayas === "number" &&
    typeof summary.createZones === "number" &&
    typeof summary.updateZones === "number" &&
    typeof summary.addMethods === "number" &&
    typeof summary.updateMethods === "number" &&
    typeof summary.skipManualZones === "number" &&
    typeof summary.conflicts === "number" &&
    typeof summary.warnings === "number" &&
    typeof summary.unchanged === "number" &&
    summary.deleteZones === 0 &&
    typeof summary.recommendedAction === "string"
  );
}

function isPreviewPlanGroups(plan: unknown): plan is PreviewPlanGroups {
  return (
    isObject(plan) &&
    isPreviewItems(plan.createZones) &&
    isPreviewItems(plan.updateZones) &&
    isPreviewItems(plan.addMethods) &&
    isPreviewItems(plan.updateMethods) &&
    isPreviewItems(plan.skipManualZones) &&
    isPreviewItems(plan.conflicts) &&
    isPreviewItems(plan.warnings) &&
    isPreviewItems(plan.unchanged)
  );
}

function isPreviewItems(items: unknown): items is PreviewPlanItem[] {
  return Array.isArray(items) && items.every(isPreviewItem);
}

function isPreviewItem(item: unknown): item is PreviewPlanItem {
  return isObject(item) && typeof item.type === "string";
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
