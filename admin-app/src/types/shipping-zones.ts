import type { AdminBootstrapConfig } from "@/bootstrap";
import type { DiagnosticsResponse, ZoneDiagnostic } from "@/types/diagnostics";
import type { ShippingMethodKey } from "@/types/generator";
import type { PreviewRequest, PreviewResponse } from "@/types/preview";

import type { GeneratorPreviewContext, MethodDef, Wilaya } from "@/components/generator/types";

export type DiagnosticsLoadState =
  | { status: "waiting" }
  | { status: "loading" }
  | { status: "ready"; response: DiagnosticsResponse }
  | { status: "error"; message: string };

export type ShippingZoneStatus =
  | "active"
  | "needs_update"
  | "missing"
  | "protected"
  | "conflict"
  | "checking"
  | "unavailable"
  | "not_managed";

export type ShippingZoneFilter =
  | "all"
  | "active"
  | "pending"
  | "needs_update"
  | "missing"
  | "protected";

export type PendingPriceMap = Record<string, Partial<Record<ShippingMethodKey, number | null>>>;
export type PendingStatusMap = Record<string, Partial<Record<ShippingMethodKey, boolean>>>;

export type ShippingZoneQuickTool =
  | { kind: "set"; value: number }
  | { kind: "percent"; value: number }
  | { kind: "amount"; value: number }
  | { kind: "round"; nearest: 10 | 50 | 100 }
  | { kind: "free" }
  | { kind: "copy"; from: ShippingMethodKey; to: ShippingMethodKey }
  | { kind: "reset" }
  | { kind: "setEnabled"; enabled: boolean };

export type LiveZoneSummary = {
  status: ShippingZoneStatus;
  message: string;
  zones: ZoneDiagnostic[];
};

export type ShippingZoneMethodView = {
  key: ShippingMethodKey;
  label: string;
  livePrice: number | null;
  pendingPrice?: number | null;
  defaultPrice: number | null;
  enabled: boolean | null;
  pendingEnabled?: boolean;
  canEdit: boolean;
  canToggleStatus: boolean;
  disabledReason?: string;
};

export type ShippingZoneRowView = {
  wilaya: Wilaya;
  liveZone: LiveZoneSummary;
  status: ShippingZoneStatus;
  statusLabel: string;
  statusMessage: string;
  home: ShippingZoneMethodView;
  office: ShippingZoneMethodView;
  pendingMethodCount: number;
  canRepair: boolean;
  canSelect: boolean;
};

export type ShippingZoneStats = {
  activeWilayas: number;
  managedMethods: number;
  pendingChanges: number;
  protectedManualZones: number;
};

export type PendingChangeItem = {
  id: string;
  wilayaCode: string;
  wilayaName: string;
  methodKey: ShippingMethodKey;
  methodLabel: string;
  from: number | null;
  to: number | null;
};

export type PendingStatusChangeItem = {
  id: string;
  wilayaCode: string;
  wilayaName: string;
  methodKey: ShippingMethodKey;
  methodLabel: string;
  from: boolean;
  to: boolean;
};

export type PendingReviewItem =
  | ({ kind: "price" } & PendingChangeItem)
  | ({ kind: "status" } & PendingStatusChangeItem);

export type ReviewContext = {
  request: PreviewRequest;
  previewContext: GeneratorPreviewContext;
};

export type ReviewChangesDialogProps = {
  open: boolean;
  config: AdminBootstrapConfig;
  changes: PendingReviewItem[];
  reviewContext: ReviewContext | null;
  onOpenChange: (open: boolean) => void;
  onPreviewReady: (
    preview: PreviewResponse,
    context: GeneratorPreviewContext,
    request: PreviewRequest,
  ) => void;
  onApplied: () => void;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
};

export type RepairSetupDialogProps = {
  open: boolean;
  config: AdminBootstrapConfig;
  rows: ShippingZoneRowView[];
  repairContext: ReviewContext | null;
  onOpenChange: (open: boolean) => void;
  onPreviewReady: (
    preview: PreviewResponse,
    context: GeneratorPreviewContext,
    request: PreviewRequest,
  ) => void;
  onRepaired: () => void;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
};

export type ShippingZonesPageProps = {
  config: AdminBootstrapConfig;
  wilayas: Wilaya[];
  methodDefs: MethodDef[];
  diagnosticsState: DiagnosticsLoadState;
  woocommerceSettingsUrl: string;
  onLaunchWizard: () => void;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
  onPreviewReady: (
    preview: PreviewResponse,
    context: GeneratorPreviewContext,
    request: PreviewRequest,
  ) => void;
};
