import type { PreviewSummary } from "./preview";

export type ApplyRequest = {
  previewHash: string;
  previewGeneratedAt: string;
  selectedWilayaCodes: string[];
  acceptedPlanSummary: Omit<PreviewSummary, "recommendedAction">;
  confirmed: true;
  confirmationText: "APPLY YAXII SHIPPING PLAN";
  safetyPolicySnapshot: {
    protectManualZones: true;
    requirePreviewBeforeApply: true;
    skipConflictsByDefault: true;
    neverDeleteManualZones: true;
  };
  applyContractVersion: "apply-contract-v1";
};

export type DisabledApplyResponse = {
  applyEngineAvailable: false;
  message: string;
  applyContractVersion: "apply-contract-v1";
  requestAccepted: true;
  validatedRequest: ApplyRequest;
  requiredNextSteps: string[];
  warnings: string[];
};
