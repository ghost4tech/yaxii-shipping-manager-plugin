import type { PreviewRequest, PreviewSummary } from "./preview";

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
  previewRequest: PreviewRequest;
};

export type ApplyResultZone = {
  wilayaCode: string;
  wilayaName?: string;
  zoneId?: number | null;
  zoneName?: string;
  location?: string;
  type?: string;
  reason?: string;
};

export type ApplyResultMethod = {
  wilayaCode: string;
  wilayaName?: string;
  zoneId?: number | null;
  zoneName?: string;
  methodKey?: string;
  methodId?: string;
  instanceId?: number | null;
  title?: string;
  lastKnownCost?: string | null;
  titleUpdated?: boolean;
  priceUpdated?: boolean;
  type?: string;
  reason?: string;
};

export type ApplyResponse = {
  applyEngineAvailable: true;
  applied: boolean;
  createdZones: ApplyResultZone[];
  createdMethods: ApplyResultMethod[];
  updatedMethods: ApplyResultMethod[];
  skippedZones: ApplyResultZone[];
  skippedMethods: ApplyResultMethod[];
  skippedMethodUpdates: ApplyResultMethod[];
  blockedZones: ApplyResultZone[];
  conflicts: ApplyResultZone[];
  warnings: string[];
  registryUpdated: boolean;
  wooCommerceChanged: boolean;
  previewHash: string;
  applyContractVersion: "apply-contract-v1";
  message: string;
};
