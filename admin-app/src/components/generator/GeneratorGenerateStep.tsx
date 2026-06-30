import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Lock, RefreshCw, Wand2 } from "lucide-react";

import { fetchApply } from "@/api/apply-api";
import type { AdminBootstrapConfig } from "@/bootstrap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { applyResultMessage } from "@/lib/generator/generate-result";
import {
  acceptedPlanSummary,
  APPLY_CONFIRMATION_TEXT,
  applyActionDescription,
  canApplyPreview,
  finalApplyStatus,
  finalStatusMessage,
  type SetupMode,
} from "@/lib/generator/preview-summary";
import type { ApplyResponse } from "@/types/apply";
import type { PreviewRequest, PreviewResponse } from "@/types/preview";

type GenerateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; response: ApplyResponse }
  | { status: "error"; message: string };

export function GeneratorGenerateStep({
  response,
  config,
  previewRequest,
  setupMode,
  onOpenDiagnostics,
  onRefreshPreview,
  onReturnToEditor,
}: {
  response: PreviewResponse;
  config: AdminBootstrapConfig;
  previewRequest: PreviewRequest;
  setupMode: SetupMode;
  onOpenDiagnostics: () => void;
  onRefreshPreview: () => Promise<void>;
  onReturnToEditor: () => void;
}) {
  const [generateState, setGenerateState] = useState<GenerateState>({ status: "idle" });
  const finalStatus = useMemo(() => finalApplyStatus(response), [response]);
  const canGenerate = useMemo(() => canApplyPreview(response), [response]);

  useEffect(() => {
    setGenerateState({ status: "idle" });
  }, [response.previewHash]);

  const generateSetup = async () => {
    setGenerateState({ status: "loading" });

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
      setGenerateState({ status: "ready", response: applyResponse });
    } catch (error) {
      setGenerateState({
        status: "error",
        message: error instanceof Error ? error.message : "Generate request failed.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
          <GenerateIcon
            state={generateState.status}
            setupMode={setupMode}
            canGenerate={canGenerate}
          />
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">
            {generateTitle(setupMode, canGenerate, finalStatus, generateState)}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {generateMessage(setupMode, canGenerate, response, finalStatus, generateState)}
          </p>
          <GenerateActions
            state={generateState}
            setupMode={setupMode}
            canGenerate={canGenerate}
            finalStatus={finalStatus}
            onGenerate={generateSetup}
            onOpenDiagnostics={onOpenDiagnostics}
            onRefreshPreview={onRefreshPreview}
            onReturnToEditor={onReturnToEditor}
          />
        </div>
        <CardContent className="grid gap-2 p-5 text-xs text-muted-foreground sm:grid-cols-2">
          <SafetyLine>Manual zones are skipped</SafetyLine>
          <SafetyLine>Conflicts are blocked</SafetyLine>
          <SafetyLine>No deletes are planned</SafetyLine>
          <SafetyLine>Preview checked before generate</SafetyLine>
        </CardContent>
      </Card>
    </div>
  );
}

function GenerateIcon({
  state,
  setupMode,
  canGenerate,
}: {
  state: GenerateState["status"];
  setupMode: SetupMode;
  canGenerate: boolean;
}) {
  const iconClassName = state === "loading" ? "h-6 w-6 animate-spin" : "h-6 w-6";
  const Icon = state === "ready" ? CheckCircle2 : state === "error" ? AlertCircle : Wand2;
  const blocked = setupMode === "preview" || !canGenerate;

  return (
    <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-primary shadow-sm">
      {state === "loading" && (
        <span className="absolute inset-0 rounded-2xl border border-primary/30 animate-ping" />
      )}
      {blocked && state === "idle" ? (
        <Lock className={iconClassName} />
      ) : (
        <Icon className={iconClassName} />
      )}
    </div>
  );
}

function GenerateActions({
  state,
  setupMode,
  canGenerate,
  finalStatus,
  onGenerate,
  onOpenDiagnostics,
  onRefreshPreview,
  onReturnToEditor,
}: {
  state: GenerateState;
  setupMode: SetupMode;
  canGenerate: boolean;
  finalStatus: ReturnType<typeof finalApplyStatus>;
  onGenerate: () => Promise<void>;
  onOpenDiagnostics: () => void;
  onRefreshPreview: () => Promise<void>;
  onReturnToEditor: () => void;
}) {
  if (state.status === "ready") {
    return <ResultActions onReturnToEditor={onReturnToEditor} />;
  }

  if (setupMode === "preview") {
    return <PreviewOnlyActions onOpenDiagnostics={onOpenDiagnostics} />;
  }

  if (!canGenerate) {
    return (
      <BlockedActions
        noGeneratorWork={finalStatus === "setup_already_matches"}
        onOpenDiagnostics={onOpenDiagnostics}
        onRefreshPreview={onRefreshPreview}
        onReturnToEditor={onReturnToEditor}
      />
    );
  }

  return <GenerateButton state={state} onGenerate={onGenerate} />;
}

function ResultActions({ onReturnToEditor }: { onReturnToEditor: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
      <Button size="lg" onClick={onReturnToEditor}>
        Return to shipping editor
      </Button>
      <Button type="button" variant="outline" size="lg" onClick={openWooCommerceZones}>
        <ExternalLink className="h-4 w-4" />
        WooCommerce zones
      </Button>
    </div>
  );
}

function PreviewOnlyActions({ onOpenDiagnostics }: { onOpenDiagnostics: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <Button type="button" variant="outline" size="lg" onClick={onOpenDiagnostics}>
        Check diagnostics
      </Button>
      <span className="text-[11px] text-muted-foreground">
        Preview-only mode does not apply WooCommerce changes.
      </span>
    </div>
  );
}

function BlockedActions({
  noGeneratorWork,
  onOpenDiagnostics,
  onRefreshPreview,
  onReturnToEditor,
}: {
  noGeneratorWork: boolean;
  onOpenDiagnostics: () => void;
  onRefreshPreview: () => Promise<void>;
  onReturnToEditor: () => void;
}) {
  if (noGeneratorWork) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2">
        <Button type="button" size="lg" onClick={onReturnToEditor}>
          Open Shipping Zones
        </Button>
        <span className="text-[11px] text-muted-foreground">
          Setup already matches this selection.
        </span>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
      <Button type="button" variant="outline" size="lg" onClick={() => void onRefreshPreview()}>
        <RefreshCw className="h-4 w-4" />
        Refresh preview
      </Button>
      <Button type="button" variant="outline" size="lg" onClick={onOpenDiagnostics}>
        Check diagnostics
      </Button>
    </div>
  );
}

function GenerateButton({
  state,
  onGenerate,
}: {
  state: GenerateState;
  onGenerate: () => Promise<void>;
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <Button
        size="lg"
        className="gap-2"
        onClick={() => void onGenerate()}
        disabled={state.status === "loading"}
      >
        <Wand2 className="h-4 w-4" />
        {state.status === "loading" ? "Generating..." : "Generate setup"}
      </Button>
      <span className="text-[11px] text-muted-foreground">
        WooCommerce is checked again before saving.
      </span>
      {state.status === "error" && (
        <span className="max-w-md text-xs text-destructive">{state.message}</span>
      )}
    </div>
  );
}

function generateTitle(
  setupMode: SetupMode,
  canGenerate: boolean,
  finalStatus: ReturnType<typeof finalApplyStatus>,
  state: GenerateState,
): string {
  if (state.status === "loading") {
    return "Generating shipping setup";
  }

  if (state.status === "ready") {
    return state.response.applied && state.response.wooCommerceChanged
      ? "Shipping setup generated"
      : "No WooCommerce changes needed";
  }

  if (state.status === "error") {
    return "Generate blocked";
  }

  if (setupMode === "preview") {
    return "Preview-only mode";
  }

  if (!canGenerate && finalStatus === "setup_already_matches") {
    return "Shipping setup already matches this preview.";
  }

  if (!canGenerate) {
    return "Review required before generating";
  }

  return "Generate shipping setup";
}

function generateMessage(
  setupMode: SetupMode,
  canGenerate: boolean,
  response: PreviewResponse,
  finalStatus: ReturnType<typeof finalApplyStatus>,
  state: GenerateState,
): string {
  if (state.status === "loading") {
    return "Yaxii is rechecking WooCommerce and saving only the reviewed supported changes.";
  }

  if (state.status === "ready") {
    return applyResultMessage(state.response);
  }

  if (state.status === "error") {
    return "WooCommerce was not changed. Refresh the preview before trying again.";
  }

  if (setupMode === "preview") {
    return "This setup mode is read-only. Switch modes if you want to generate changes.";
  }

  if (!canGenerate) {
    return finalStatusMessage(response, finalStatus);
  }

  return applyActionDescription(response);
}

function SafetyLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      <span>{children}</span>
    </div>
  );
}

function openWooCommerceZones() {
  window.open("admin.php?page=wc-settings&tab=shipping", "_blank", "noopener,noreferrer");
}
