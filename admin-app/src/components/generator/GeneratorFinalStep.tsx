import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { fetchApply } from "@/api/apply-api";
import type { AdminBootstrapConfig } from "@/bootstrap";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  acceptedPlanSummary,
  APPLY_CONFIRMATION_TEXT,
  canApplyPreview,
  finalApplyStatus,
  type SetupMode,
} from "@/lib/generator/preview-summary";
import type { ApplyResponse } from "@/types/apply";
import type { PreviewRequest, PreviewResponse } from "@/types/preview";

import { GeneratorAdvancedDetails } from "./GeneratorAdvancedDetails";
import { GeneratorApplyActionCard } from "./GeneratorApplyActionCard";
import { GeneratorApplyResult } from "./GeneratorApplyResult";
import { GeneratorPreviewGroups } from "./GeneratorPreviewGroups";
import { GeneratorPreviewSample } from "./GeneratorPreviewSample";
import { GeneratorPreviewSummary } from "./GeneratorPreviewSummary";
import type { GeneratorPreviewContext } from "./types";

export function GeneratorFinalStep({
  response,
  context,
  config,
  previewRequest,
  onOpenDiagnostics,
  onRefreshDiagnostics,
  onRefreshPreview,
  onDone,
  setupMode = "continue",
}: {
  response: PreviewResponse;
  context?: GeneratorPreviewContext;
  config: AdminBootstrapConfig;
  previewRequest: PreviewRequest;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
  onRefreshPreview?: () => void;
  onDone: () => void;
  setupMode?: SetupMode;
}) {
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [applyState, setApplyState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; response: ApplyResponse }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const finalStatus = useMemo(() => finalApplyStatus(response), [response]);
  const canApply = useMemo(() => canApplyPreview(response), [response]);

  const applyPreview = async () => {
    setApplyState({ status: "loading" });

    try {
      const applyResponse = await fetchApply(config, {
        previewHash: response.previewHash,
        previewGeneratedAt: response.previewGeneratedAt,
        selectedWilayaCodes: previewRequest.selectedWilayaCodes ?? [],
        acceptedPlanSummary: acceptedPlanSummary(response),
        confirmed: true,
        confirmationText: APPLY_CONFIRMATION_TEXT,
        safetyPolicySnapshot: response.safetyPolicy,
        applyContractVersion: response.applyContractVersion,
        previewRequest,
      });
      setApplyState({ status: "ready", response: applyResponse });
    } catch (error) {
      setApplyState({
        status: "error",
        message: error instanceof Error ? error.message : "Apply request failed.",
      });
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <GeneratorPreviewSummary response={response} context={context} setupMode={setupMode} />
      <GeneratorPreviewGroups response={response} />
      <GeneratorPreviewSample response={response} />
      <GeneratorApplyActionCard
        response={response}
        finalStatus={finalStatus}
        canApply={canApply}
        setupMode={setupMode}
        confirmationChecked={confirmationChecked}
        applyStateStatus={applyState.status}
        onConfirmationChange={setConfirmationChecked}
        onApply={applyPreview}
        onOpenDiagnostics={onOpenDiagnostics}
        onRefreshPreview={onRefreshPreview}
        onDone={onDone}
      />

      {applyState.status === "ready" && (
        <GeneratorApplyResult
          response={applyState.response}
          pendingZoneUpdates={response.summary.updateZones}
          onRefreshDiagnostics={onRefreshDiagnostics}
          onDone={onDone}
        />
      )}

      {applyState.status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Apply blocked</AlertTitle>
          <AlertDescription>{applyState.message}</AlertDescription>
        </Alert>
      )}

      <GeneratorAdvancedDetails response={response} />
    </div>
  );
}
