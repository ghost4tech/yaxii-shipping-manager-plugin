import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

import { fetchApply } from "@/api/apply-api";
import { fetchPreview } from "@/api/preview-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  acceptedPlanSummary,
  previewHasOnlySafeMethodUpdates,
} from "@/lib/shipping-zones/preview-request";
import { formatDzdPrice } from "@/lib/shipping-zones/status";
import type { ApplyResponse } from "@/types/apply";
import type { ReviewChangesDialogProps } from "@/types/shipping-zones";

const APPLY_CONFIRMATION_TEXT = "APPLY YAXII SHIPPING PLAN";

type ReviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "blocked"; message: string }
  | { status: "applied"; response: ApplyResponse }
  | { status: "error"; message: string };

export function ReviewChangesDialog({
  open,
  config,
  changes,
  reviewContext,
  onOpenChange,
  onPreviewReady,
  onApplied,
  onOpenDiagnostics,
  onRefreshDiagnostics,
}: ReviewChangesDialogProps) {
  const [reviewState, setReviewState] = useState<ReviewState>({ status: "idle" });

  const saveChanges = async () => {
    if (!reviewContext) {
      setReviewState({ status: "error", message: "No supported pending changes to review." });
      return;
    }

    setReviewState({ status: "loading" });
    try {
      const preview = await fetchPreview(config, reviewContext.request);
      onPreviewReady(preview, reviewContext.previewContext, reviewContext.request);

      if (!previewHasOnlySafeMethodUpdates(preview)) {
        setReviewState({
          status: "blocked",
          message:
            preview.plan.conflicts.length > 0
              ? "WooCommerce reported a conflict. No changes were saved."
              : preview.canApplyLater
                ? "This review includes setup work. Open the Generator to handle missing setup safely."
                : preview.canApplyLaterMessage,
        });
        return;
      }

      const applyResponse = await fetchApply(config, {
        previewHash: preview.previewHash,
        previewGeneratedAt: preview.previewGeneratedAt,
        selectedWilayaCodes: reviewContext.request.selectedWilayaCodes ?? [],
        acceptedPlanSummary: acceptedPlanSummary(preview),
        confirmed: true,
        confirmationText: APPLY_CONFIRMATION_TEXT,
        safetyPolicySnapshot: preview.safetyPolicy,
        applyContractVersion: preview.applyContractVersion,
        previewRequest: reviewContext.request,
      });

      setReviewState({ status: "applied", response: applyResponse });
      if (applyResponse.applied && applyResponse.wooCommerceChanged) {
        onApplied();
        onRefreshDiagnostics();
      }
    } catch (error) {
      setReviewState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to save changes.",
      });
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setReviewState({ status: "idle" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>
            WooCommerce will be checked again before updating. Protected zones will not be touched.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border">
          {changes.map((change) => (
            <div
              key={change.id}
              className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-sm last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {change.wilayaCode} - {change.wilayaName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {change.methodLabel} {change.kind === "status" ? "status" : "price"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm tabular-nums">
                <span className="text-muted-foreground line-through">
                  {formatChangeFrom(change)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{formatChangeTo(change)}</span>
              </div>
            </div>
          ))}
          {changes.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No supported pending changes.
            </div>
          )}
        </div>

        {reviewState.status === "blocked" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Update blocked</AlertTitle>
            <AlertDescription>{reviewState.message}</AlertDescription>
          </Alert>
        )}
        {reviewState.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Update failed</AlertTitle>
            <AlertDescription>{reviewState.message}</AlertDescription>
          </Alert>
        )}
        {reviewState.status === "applied" && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>
              {reviewState.response.wooCommerceChanged
                ? "Shipping changes updated"
                : "No changes made"}
            </AlertTitle>
            <AlertDescription>{reviewState.response.message}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {(reviewState.status === "blocked" || reviewState.status === "error") && (
            <Button type="button" variant="outline" onClick={onOpenDiagnostics}>
              Check diagnostics
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
            {reviewState.status === "applied" ? "Done" : "Cancel"}
          </Button>
          {reviewState.status !== "applied" && (
            <Button
              type="button"
              onClick={() => void saveChanges()}
              disabled={changes.length === 0 || reviewState.status === "loading"}
            >
              {reviewState.status === "loading" && <RefreshCw className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatChangeFrom(change: ReviewChangesDialogProps["changes"][number]): string {
  return change.kind === "status" ? statusLabel(change.from) : formatDzdPrice(change.from);
}

function formatChangeTo(change: ReviewChangesDialogProps["changes"][number]): string {
  return change.kind === "status" ? statusLabel(change.to) : formatDzdPrice(change.to);
}

function statusLabel(enabled: boolean): string {
  return enabled ? "Enabled" : "Disabled";
}
