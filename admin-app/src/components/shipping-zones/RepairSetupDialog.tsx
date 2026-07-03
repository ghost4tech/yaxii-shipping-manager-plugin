import { useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw, Wrench } from "lucide-react";

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
  previewHasSafeSetupRepair,
} from "@/lib/shipping-zones/preview-request";
import type { ApplyResponse } from "@/types/apply";
import type { RepairSetupDialogProps } from "@/types/shipping-zones";

const APPLY_CONFIRMATION_TEXT = "APPLY YAXII SHIPPING PLAN";

type RepairState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "blocked"; message: string }
  | { status: "repaired"; response: ApplyResponse }
  | { status: "error"; message: string };

export function RepairSetupDialog({
  open,
  config,
  rows,
  repairContext,
  onOpenChange,
  onPreviewReady,
  onRepaired,
  onOpenDiagnostics,
  onRefreshDiagnostics,
}: RepairSetupDialogProps) {
  const [repairState, setRepairState] = useState<RepairState>({ status: "idle" });
  const repairCount = repairContext?.request.selectedWilayaCodes?.length ?? rows.length;

  const repairSetup = async () => {
    if (!repairContext) {
      setRepairState({ status: "error", message: "No missing setup rows are selected." });
      return;
    }

    setRepairState({ status: "loading" });
    try {
      const preview = await fetchPreview(config, repairContext.request);
      onPreviewReady(preview, repairContext.previewContext, repairContext.request);

      if (!previewHasSafeSetupRepair(preview)) {
        setRepairState({
          status: "blocked",
          message:
            preview.plan.conflicts.length > 0
              ? "WooCommerce reported a conflict. No shipping setup was repaired."
              : preview.canApplyLaterMessage,
        });
        return;
      }

      const response = await fetchApply(config, {
        previewHash: preview.previewHash,
        previewGeneratedAt: preview.previewGeneratedAt,
        selectedWilayaCodes: repairContext.request.selectedWilayaCodes ?? [],
        acceptedPlanSummary: acceptedPlanSummary(preview),
        confirmed: true,
        confirmationText: APPLY_CONFIRMATION_TEXT,
        safetyPolicySnapshot: preview.safetyPolicy,
        applyContractVersion: preview.applyContractVersion,
        previewRequest: repairContext.request,
      });

      setRepairState({ status: "repaired", response });
      if (response.applied && response.wooCommerceChanged) {
        onRepaired();
        onRefreshDiagnostics();
      }
    } catch (error) {
      setRepairState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to repair shipping setup.",
      });
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setRepairState({ status: "idle" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Repair shipping setup</DialogTitle>
          <DialogDescription>
            Yaxii will recreate the missing managed zones and methods for selected wilayas. Manual
            zones will not be touched.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border">
          {rows.map((row) => (
            <div
              key={row.wilaya.code}
              className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-sm last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {row.wilaya.code} - {row.wilaya.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  This wilaya is missing its Yaxii-managed zone or methods.
                </div>
              </div>
              <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No missing setup rows selected.
            </div>
          )}
        </div>

        {repairState.status === "blocked" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Repair blocked</AlertTitle>
            <AlertDescription>{repairState.message}</AlertDescription>
          </Alert>
        )}
        {repairState.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Repair failed</AlertTitle>
            <AlertDescription>{repairState.message}</AlertDescription>
          </Alert>
        )}
        {repairState.status === "repaired" && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Shipping setup repaired</AlertTitle>
            <AlertDescription>
              {repairCount} wilaya{repairCount === 1 ? " was" : "s were"} repaired. Protected zones
              were not touched.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {(repairState.status === "blocked" || repairState.status === "error") && (
            <Button type="button" variant="outline" onClick={onOpenDiagnostics}>
              Check diagnostics
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
            {repairState.status === "repaired" ? "Done" : "Cancel"}
          </Button>
          {repairState.status !== "repaired" && (
            <Button
              type="button"
              onClick={() => void repairSetup()}
              disabled={rows.length === 0 || repairState.status === "loading"}
            >
              {repairState.status === "loading" && <RefreshCw className="h-4 w-4 animate-spin" />}
              Repair setup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
