import { Activity, Lock, RefreshCw, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  applyButtonLabel,
  finalStatusMessage,
  finalStatusTitle,
  type FinalApplyStatus,
  type SetupMode,
} from "@/lib/generator/preview-summary";
import type { PreviewResponse } from "@/types/preview";

export function GeneratorApplyActionCard({
  response,
  finalStatus,
  canApply,
  setupMode,
  confirmationChecked,
  applyStateStatus,
  onConfirmationChange,
  onApply,
  onOpenDiagnostics,
  onRefreshPreview,
  onDone,
}: {
  response: PreviewResponse;
  finalStatus: FinalApplyStatus;
  canApply: boolean;
  setupMode: SetupMode;
  confirmationChecked: boolean;
  applyStateStatus: "idle" | "loading" | "ready" | "error";
  onConfirmationChange: (checked: boolean) => void;
  onApply: () => Promise<void>;
  onOpenDiagnostics: () => void;
  onRefreshPreview?: () => void;
  onDone: () => void;
}) {
  const previewOnly = setupMode === "preview";
  const readyForApply =
    (finalStatus === "ready_to_apply" || finalStatus === "ready_to_update_prices") &&
    canApply &&
    !previewOnly;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{finalStatusTitle(finalStatus)}</CardTitle>
            <CardDescription>{finalStatusMessage(response, finalStatus)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
          Manual zones are protected. WooCommerce is checked again before applying.
        </div>

        {previewOnly && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Preview-only mode</AlertTitle>
            <AlertDescription>Apply controls are hidden for this setup mode.</AlertDescription>
          </Alert>
        )}

        {readyForApply && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              checked={confirmationChecked}
              onCheckedChange={(checked) => onConfirmationChange(Boolean(checked))}
            />
            <div className="space-y-3">
              <div className="text-sm font-medium">I reviewed this setup</div>
              <div className="text-xs text-muted-foreground">
                Yaxii sends the reviewed preview details back to WooCommerce for revalidation.
              </div>
              <Button
                onClick={() => void onApply()}
                disabled={applyStateStatus === "loading" || !confirmationChecked}
              >
                <ShieldCheck className="h-4 w-4" />
                {applyStateStatus === "loading"
                  ? "Applying reviewed setup..."
                  : applyButtonLabel(response)}
              </Button>
            </div>
          </div>
        )}

        {!readyForApply && (
          <ApplyFallbackActions
            finalStatus={finalStatus}
            onDone={onDone}
            onOpenDiagnostics={onOpenDiagnostics}
            onRefreshPreview={onRefreshPreview}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ApplyFallbackActions({
  finalStatus,
  onDone,
  onOpenDiagnostics,
  onRefreshPreview,
}: {
  finalStatus: FinalApplyStatus;
  onDone: () => void;
  onOpenDiagnostics: () => void;
  onRefreshPreview?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {finalStatus === "blocked" ? (
        <Button
          type="button"
          onClick={() => void onRefreshPreview?.()}
          disabled={!onRefreshPreview}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh preview
        </Button>
      ) : (
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      )}
      <Button type="button" variant="outline" onClick={onOpenDiagnostics}>
        <Activity className="h-4 w-4" />
        Check diagnostics
      </Button>
    </div>
  );
}
