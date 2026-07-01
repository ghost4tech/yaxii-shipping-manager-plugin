import { useEffect, useMemo, useState } from "react";
import { Eye, ShieldCheck, Wand2 } from "lucide-react";

import {
  pendingChangeCount,
  pendingReviewItems,
  withPendingPrice,
  withPendingStatus,
} from "@/lib/shipping-zones/pending-changes";
import {
  repairContextFromRows,
  reviewContextFromPendingChanges,
} from "@/lib/shipping-zones/preview-request";
import {
  buildShippingZoneRows,
  isShippingMethodKey,
  liveMethodEnabledForKey,
  livePriceForKey,
  methodKeys,
  rowMatchesFilter,
  rowMatchesSearch,
  shippingZoneMethodDefs,
  shippingZoneStats,
} from "@/lib/shipping-zones/status";
import type { ShippingMethodKey } from "@/types/generator";
import type {
  PendingPriceMap,
  PendingStatusMap,
  PostApplyVerificationMap,
  DiagnosticsLoadState,
  ShippingZoneQuickTool,
  ShippingZoneFilter,
  ShippingZoneMethodView,
  ShippingZoneRowView,
  ShippingZonesPageProps,
} from "@/types/shipping-zones";

import { PendingChangesBar } from "./PendingChangesBar";
import { RepairSetupDialog } from "./RepairSetupDialog";
import { ReviewChangesDialog } from "./ReviewChangesDialog";
import { ShippingZonesHeader } from "./ShippingZonesHeader";
import { ShippingZonesStatusCard } from "./ShippingZonesStatusCard";
import { ShippingZonesTable } from "./ShippingZonesTable";
import { ShippingZonesToolbar } from "./ShippingZonesToolbar";

type BulkTarget = ShippingMethodKey | "all";
type PostApplyVerificationState = {
  expected: PostApplyVerificationMap;
  refreshStarted: boolean;
  phase: "verifying" | "verified" | "failed" | "mismatch";
};

export function ShippingZonesPage({
  config,
  wilayas,
  methodDefs,
  diagnosticsState,
  woocommerceSettingsUrl,
  onLaunchWizard,
  onOpenDiagnostics,
  onRefreshDiagnostics,
  onPreviewReady,
}: ShippingZonesPageProps) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<ShippingZoneFilter>("all");
  const [search, setSearch] = useState("");
  const [pendingPrices, setPendingPrices] = useState<PendingPriceMap>({});
  const [pendingStatuses, setPendingStatuses] = useState<PendingStatusMap>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [repairRows, setRepairRows] = useState<ShippingZoneRowView[]>([]);
  const [emptySetupTableVisible, setEmptySetupTableVisible] = useState(false);
  const [postApplyVerification, setPostApplyVerification] =
    useState<PostApplyVerificationState | null>(null);
  const [verificationWarning, setVerificationWarning] = useState<string | null>(null);

  const displayMethodDefs = useMemo(
    () => shippingZoneMethodDefs(methodDefs, diagnosticsState),
    [diagnosticsState, methodDefs],
  );
  const editableMethodKeys = methodKeys(displayMethodDefs);

  const rows = useMemo(
    () =>
      buildShippingZoneRows(
        wilayas,
        displayMethodDefs,
        diagnosticsState,
        pendingPrices,
        pendingStatuses,
        postApplyVerification?.expected,
        postApplyVerification?.phase,
      ),
    [
      diagnosticsState,
      displayMethodDefs,
      pendingPrices,
      pendingStatuses,
      postApplyVerification,
      wilayas,
    ],
  );
  const bulkTargetMethods = bulkTargetMethodViews(rows, editableMethodKeys);
  const visibleRows = rows.filter(
    (row) => rowMatchesFilter(row, filter) && rowMatchesSearch(row, search),
  );
  const selectableVisibleRows = visibleRows.filter((row) => row.canSelect);
  const allSelected =
    selectableVisibleRows.length > 0 &&
    selectableVisibleRows.every((row) => selectedCodes.includes(row.wilaya.code));
  const selectedRows = rows.filter((row) => selectedCodes.includes(row.wilaya.code));
  const selectedRowsWithEditableMethods = selectedRows.filter((row) =>
    methodViewsForBulkTarget(row, "all").some((method) => method.canEdit),
  );
  const selectedRowsWithToggleableMethods = selectedRows.filter((row) =>
    methodViewsForBulkTarget(row, "all").some((method) => method.canToggleStatus),
  );
  const selectedRepairableRows = selectedRows.filter((row) => row.canRepair);
  const actionableSelectionCodes = new Set([
    ...selectedRowsWithEditableMethods.map((row) => row.wilaya.code),
    ...selectedRowsWithToggleableMethods.map((row) => row.wilaya.code),
    ...selectedRepairableRows.map((row) => row.wilaya.code),
  ]);
  const protectedSelectionCount = selectedRows.length - actionableSelectionCodes.size;
  const stats = shippingZoneStats(rows);
  const emptySetupState = emptySetupViewState(rows, diagnosticsState);
  const tableVisible = !emptySetupState.show || emptySetupTableVisible;
  const pendingCount = pendingChangeCount(pendingPrices, pendingStatuses);
  const changes = pendingReviewItems(rows, pendingPrices, pendingStatuses);
  const reviewContext = reviewContextFromPendingChanges(
    wilayas,
    displayMethodDefs,
    diagnosticsState,
    pendingPrices,
    pendingStatuses,
  );
  const repairContext = repairContextFromRows(repairRows, displayMethodDefs);

  useEffect(() => {
    if (!postApplyVerification || postApplyVerification.phase !== "verifying") {
      return;
    }

    if (diagnosticsState.status === "loading" || diagnosticsState.status === "waiting") {
      if (!postApplyVerification.refreshStarted) {
        setPostApplyVerification({
          ...postApplyVerification,
          refreshStarted: true,
        });
      }
      return;
    }

    if (!postApplyVerification.refreshStarted) {
      return;
    }

    if (diagnosticsState.status === "error") {
      setPostApplyVerification({
        ...postApplyVerification,
        phase: "failed",
      });
      setVerificationWarning("Update sent, but verification failed. Refresh diagnostics.");
      return;
    }

    if (postApplyMatchesDiagnostics(postApplyVerification.expected, diagnosticsState)) {
      setPostApplyVerification({
        ...postApplyVerification,
        phase: "verified",
      });
      setVerificationWarning(null);
      return;
    }

    setPostApplyVerification({
      ...postApplyVerification,
      phase: "mismatch",
    });
    setVerificationWarning("Update sent, but WooCommerce still differs. Review changes.");
  }, [diagnosticsState, postApplyVerification]);

  const updatePendingPrice = (
    row: ShippingZoneRowView,
    method: ShippingMethodKey,
    price: number | null | undefined,
  ) => {
    setPendingPrices((current) =>
      withPendingPrice(
        current,
        row.wilaya.code,
        method,
        livePriceForKey(row.liveZone, method),
        price,
      ),
    );
  };

  const updatePendingStatus = (
    row: ShippingZoneRowView,
    method: ShippingMethodKey,
    enabled: boolean | undefined,
  ) => {
    setPendingStatuses((current) =>
      withPendingStatus(current, row.wilaya.code, method, liveMethodEnabled(row, method), enabled),
    );
  };

  const setBulkPendingPrice = (target: BulkTarget, price: number | null) => {
    setPendingPrices((current) =>
      selectedRows.reduce((nextPrices, row) => {
        return methodViewsForBulkTarget(row, target).reduce((methodPrices, method) => {
          if (!method.canEdit) {
            return methodPrices;
          }

          return withPendingPrice(
            methodPrices,
            row.wilaya.code,
            method.key,
            method.livePrice,
            price,
          );
        }, nextPrices);
      }, current),
    );
  };

  const setBulkPendingStatus = (target: BulkTarget, enabled: boolean) => {
    setPendingStatuses((current) =>
      selectedRows.reduce((nextStatuses, row) => {
        return methodViewsForBulkTarget(row, target).reduce((methodStatuses, method) => {
          if (!method.canToggleStatus) {
            return methodStatuses;
          }

          return withPendingStatus(
            methodStatuses,
            row.wilaya.code,
            method.key,
            method.enabled,
            enabled,
          );
        }, nextStatuses);
      }, current),
    );
  };

  const runQuickTool = (tool: ShippingZoneQuickTool, target: BulkTarget) => {
    if (tool.kind === "set") {
      setBulkPendingPrice(target, Math.max(0, tool.value));
      return;
    }

    if (tool.kind === "free") {
      setBulkPendingPrice(target, 0);
      return;
    }

    if (tool.kind === "setEnabled") {
      setBulkPendingStatus(target, tool.enabled);
      return;
    }

    setPendingPrices((current) => {
      return selectedRows.reduce((nextPrices, row) => {
        if (tool.kind === "copy") {
          return copySelectedMethodPrice(row, tool.from, tool.to, nextPrices);
        }

        return methodViewsForBulkTarget(row, target).reduce((methodPrices, method) => {
          if (!method.canEdit) {
            return methodPrices;
          }

          if (tool.kind === "reset") {
            return withPendingPrice(
              methodPrices,
              row.wilaya.code,
              method.key,
              method.livePrice,
              undefined,
            );
          }

          const nextPrice = transformedMethodPrice(method, tool);
          if (nextPrice === undefined) {
            return methodPrices;
          }

          return withPendingPrice(
            methodPrices,
            row.wilaya.code,
            method.key,
            method.livePrice,
            nextPrice,
          );
        }, nextPrices);
      }, current);
    });
  };

  const toggleSelectAll = (selected: boolean) => {
    const selectableCodes = selectableVisibleRows.map((row) => row.wilaya.code);
    setSelectedCodes((current) =>
      selected
        ? Array.from(new Set([...current, ...selectableCodes]))
        : current.filter((code) => !selectableCodes.includes(code)),
    );
  };

  const toggleRowSelection = (wilayaCode: string, selected: boolean) => {
    setSelectedCodes((current) =>
      selected
        ? Array.from(new Set([...current, wilayaCode]))
        : current.filter((code) => code !== wilayaCode),
    );
  };

  const clearPendingChanges = () => {
    setPendingPrices({});
    setPendingStatuses({});
    setReviewOpen(false);
  };

  const reviewRowDefaultChanges = (row: ShippingZoneRowView) => {
    setPendingPrices((current) =>
      row.methods.reduce((nextPrices, method) => {
        const draftPrice = row.wilaya.methods[method.key]?.price ?? method.defaultPrice;
        if (!method.canEdit || draftPrice === method.livePrice) {
          return nextPrices;
        }

        return withPendingPrice(
          nextPrices,
          row.wilaya.code,
          method.key,
          method.livePrice,
          draftPrice,
        );
      }, current),
    );
    setReviewOpen(true);
  };

  const openRepairDialog = (nextRepairRows: ShippingZoneRowView[]) => {
    setRepairRows(nextRepairRows.filter((row) => row.canRepair));
  };

  const closeRepairDialog = (open: boolean) => {
    if (!open) {
      setRepairRows([]);
    }
  };

  const handleSetupRepaired = () => {
    setSelectedCodes([]);
  };

  const handleChangesApplied = () => {
    const expected = postApplyVerificationFromChanges(changes);
    setPostApplyVerification(
      Object.keys(expected).length > 0
        ? { expected, refreshStarted: false, phase: "verifying" }
        : null,
    );
    setVerificationWarning(null);
    setPendingPrices({});
    setPendingStatuses({});
  };

  return (
    <div className="pb-24">
      <ShippingZonesHeader />
      <ShippingZonesStatusCard
        stats={stats}
        woocommerceSettingsUrl={woocommerceSettingsUrl}
        onOpenDiagnostics={onOpenDiagnostics}
      />
      {emptySetupState.show && (
        <EmptySetupPanel
          manualZoneCount={emptySetupState.manualZoneCount}
          tableVisible={emptySetupTableVisible}
          onGenerateSetup={onLaunchWizard}
          onViewAllWilayas={() => {
            setFilter("all");
            setSearch("");
            setEmptySetupTableVisible(true);
          }}
        />
      )}
      {tableVisible && (
        <ShippingZonesToolbar
          rows={rows}
          search={search}
          filter={filter}
          pendingCount={pendingCount}
          selectedCount={selectedCodes.length}
          editableSelectionCount={selectedRowsWithEditableMethods.length}
          statusSelectionCount={selectedRowsWithToggleableMethods.length}
          repairableSelectionCount={selectedRepairableRows.length}
          protectedSelectionCount={protectedSelectionCount}
          targetMethods={bulkTargetMethods}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onRunQuickTool={runQuickTool}
          onClearSelection={() => setSelectedCodes([])}
          onReviewChanges={() => setReviewOpen(true)}
          onRepairSelected={() => openRepairDialog(selectedRepairableRows)}
        />
      )}
      {verificationWarning && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {verificationWarning}
        </div>
      )}
      {tableVisible && (
        <ShippingZonesTable
          rows={visibleRows}
          selectedCodes={selectedCodes}
          expandedRows={expandedRows}
          allSelected={allSelected}
          onSelectAll={toggleSelectAll}
          onToggleSelect={toggleRowSelection}
          onToggleExpand={(wilayaCode) =>
            setExpandedRows((current) => ({
              ...current,
              [wilayaCode]: !current[wilayaCode],
            }))
          }
          onPriceChange={updatePendingPrice}
          onWilayaStatusChange={(row, enabled) =>
            methodViewsForBulkTarget(row, "all").forEach((method) => {
              if (method.canToggleStatus) {
                updatePendingStatus(row, method.key, enabled);
              }
            })
          }
          onUndo={(row, method) => updatePendingPrice(row, method, undefined)}
          onUndoStatus={(row, method) => updatePendingStatus(row, method, undefined)}
          onOpenDiagnostics={onOpenDiagnostics}
          onOpenWooCommerceZones={() =>
            window.open(woocommerceSettingsUrl, "_blank", "noopener,noreferrer")
          }
          onLaunchWizard={onLaunchWizard}
          onReviewRowChanges={reviewRowDefaultChanges}
          onRepairSetup={(row) => openRepairDialog([row])}
          onClearSearch={() => {
            setSearch("");
            setFilter("all");
          }}
        />
      )}
      {tableVisible && pendingCount === 0 && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No pending changes. Edit a managed price or status to start.
        </p>
      )}
      {pendingCount > 0 && (
        <PendingChangesBar
          count={pendingCount}
          onDiscard={clearPendingChanges}
          onReview={() => setReviewOpen(true)}
        />
      )}
      <ReviewChangesDialog
        open={reviewOpen}
        config={config}
        changes={changes}
        reviewContext={reviewContext}
        onOpenChange={setReviewOpen}
        onPreviewReady={onPreviewReady}
        onApplied={handleChangesApplied}
        onOpenDiagnostics={onOpenDiagnostics}
        onRefreshDiagnostics={onRefreshDiagnostics}
      />
      <RepairSetupDialog
        open={repairRows.length > 0}
        config={config}
        rows={repairRows}
        repairContext={repairContext}
        onOpenChange={closeRepairDialog}
        onPreviewReady={onPreviewReady}
        onRepaired={handleSetupRepaired}
        onOpenDiagnostics={onOpenDiagnostics}
        onRefreshDiagnostics={onRefreshDiagnostics}
      />
    </div>
  );
}

function EmptySetupPanel({
  manualZoneCount,
  tableVisible,
  onGenerateSetup,
  onViewAllWilayas,
}: {
  manualZoneCount: number;
  tableVisible: boolean;
  onGenerateSetup: () => void;
  onViewAllWilayas: () => void;
}) {
  return (
    <div className="mt-5 rounded-md border border-primary/25 bg-primary/5 px-6 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <div className="mx-auto mt-4 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">No shipping setup yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate Yaxii-managed WooCommerce shipping zones, then manage prices and methods from
          this page.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Manual WooCommerce zones, if any, are protected and will not be edited by Yaxii.
        </p>
        {manualZoneCount > 0 && (
          <p className="mt-3 text-xs font-medium text-amber-900">
            Manual WooCommerce zones are protected.
          </p>
        )}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onGenerateSetup}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Wand2 className="h-4 w-4" />
          Generate shipping zones
        </button>
        <button
          type="button"
          onClick={onViewAllWilayas}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
          disabled={tableVisible}
        >
          <Eye className="h-4 w-4" />
          {tableVisible ? "All wilayas visible" : "View all wilayas"}
        </button>
      </div>
      {tableVisible && (
        <div className="mt-5 text-xs text-muted-foreground">
          The full wilaya table is visible below for inspection and partial repair work.
        </div>
      )}
    </div>
  );
}

function emptySetupViewState(
  rows: ShippingZoneRowView[],
  diagnosticsState: DiagnosticsLoadState,
): { show: boolean; manualZoneCount: number } {
  if (diagnosticsState.status !== "ready") {
    return { show: false, manualZoneCount: 0 };
  }

  const manualZoneCount = diagnosticsState.response.zoneResults.filter(
    (zone) => zone.ownershipHint === "manual_unknown",
  ).length;
  const summary = diagnosticsState.response.summary;
  const missingThreshold = Math.max(
    summary.totalWilayas - manualZoneCount,
    Math.ceil(summary.totalWilayas * 0.8),
  );
  const activeManagedRows = rows.filter((row) =>
    ["active", "partially_active", "disabled", "needs_update", "updating"].includes(row.status),
  ).length;
  const mostWilayasMissing = summary.missingWilayas >= missingThreshold;
  const onlyManualRowsConfigured =
    manualZoneCount > 0 && summary.configuredWilayas > 0 && rows.every(rowIsMissingOrProtected);

  return {
    show:
      summary.managedRegistryZoneCount === 0 &&
      (mostWilayasMissing || onlyManualRowsConfigured) &&
      activeManagedRows === 0,
    manualZoneCount,
  };
}

function rowIsMissingOrProtected(row: ShippingZoneRowView): boolean {
  return row.status === "missing" || row.status === "protected" || row.status === "not_managed";
}

function postApplyVerificationFromChanges(
  changes: ReturnType<typeof pendingReviewItems>,
): PostApplyVerificationMap {
  return changes.reduce<PostApplyVerificationMap>((expected, change) => {
    expected[change.wilayaCode] = expected[change.wilayaCode] ?? {};
    const methodExpectation = expected[change.wilayaCode]?.[change.methodKey] ?? {};

    expected[change.wilayaCode] = {
      ...expected[change.wilayaCode],
      [change.methodKey]:
        change.kind === "price"
          ? { ...methodExpectation, price: change.to }
          : { ...methodExpectation, enabled: change.to },
    };

    return expected;
  }, {});
}

function postApplyMatchesDiagnostics(
  expected: PostApplyVerificationMap,
  diagnosticsState: DiagnosticsLoadState,
): boolean {
  if (diagnosticsState.status !== "ready") {
    return false;
  }

  return Object.entries(expected).every(([wilayaCode, methodExpectations]) => {
    const wilayaResult = diagnosticsState.response.wilayaResults.find(
      (wilaya) => wilaya.code === wilayaCode,
    );
    const zones = wilayaResult
      ? diagnosticsState.response.zoneResults.filter((zone) =>
          wilayaResult.zoneIds.includes(zone.zoneId),
        )
      : [];
    const liveZone = { status: "active" as const, message: "", zones };

    return Object.entries(methodExpectations).every(([methodKey, expectation]) => {
      if (!isShippingMethodKey(methodKey)) {
        return false;
      }

      if (
        expectation.price !== undefined &&
        livePriceForKey(liveZone, methodKey) !== expectation.price
      ) {
        return false;
      }

      if (
        expectation.enabled !== undefined &&
        liveMethodEnabledForKey(liveZone, methodKey) !== expectation.enabled
      ) {
        return false;
      }

      return true;
    });
  });
}

function methodViewsForBulkTarget(
  row: ShippingZoneRowView,
  target: BulkTarget,
): ShippingZoneMethodView[] {
  if (target === "all") {
    return row.methods;
  }

  return row.methods.filter((method) => method.key === target);
}

function bulkTargetMethodViews(
  rows: ShippingZoneRowView[],
  fallbackKeys: ShippingMethodKey[],
): Array<{ key: ShippingMethodKey; label: string }> {
  const methods = rows[0]?.methods ?? [];
  if (methods.length > 0) {
    return methods.map((method) => ({ key: method.key, label: method.label }));
  }

  return fallbackKeys.map((key) => ({ key, label: fallbackMethodLabel(key) }));
}

function copySelectedMethodPrice(
  row: ShippingZoneRowView,
  from: ShippingMethodKey,
  to: ShippingMethodKey,
  pendingPrices: PendingPriceMap,
): PendingPriceMap {
  const targetMethod = row.methods.find((method) => method.key === to);
  if (!targetMethod?.canEdit) {
    return pendingPrices;
  }

  const sourcePrice = currentMethodPrice(row, from);
  if (sourcePrice === undefined) {
    return pendingPrices;
  }

  return withPendingPrice(pendingPrices, row.wilaya.code, to, targetMethod.livePrice, sourcePrice);
}

function transformedMethodPrice(
  method: ShippingZoneMethodView,
  tool: Extract<ShippingZoneQuickTool, { kind: "percent" | "amount" | "round" }>,
): number | undefined {
  const currentPrice = method.pendingPrice !== undefined ? method.pendingPrice : method.livePrice;
  if (typeof currentPrice !== "number") {
    return undefined;
  }

  if (tool.kind === "percent") {
    return Math.max(0, Math.round(currentPrice * (1 + tool.value / 100)));
  }

  if (tool.kind === "amount") {
    return Math.max(0, Math.round(currentPrice + tool.value));
  }

  return Math.max(0, Math.round(currentPrice / tool.nearest) * tool.nearest);
}

function currentMethodPrice(
  row: ShippingZoneRowView,
  method: ShippingMethodKey,
): number | null | undefined {
  const methodView = row.methods.find((item) => item.key === method);
  if (!methodView) {
    return undefined;
  }

  return methodView.pendingPrice !== undefined ? methodView.pendingPrice : methodView.livePrice;
}

function liveMethodEnabled(row: ShippingZoneRowView, method: ShippingMethodKey): boolean | null {
  const methodView = row.methods.find((item) => item.key === method);

  return methodView?.enabled ?? null;
}

function fallbackMethodLabel(key: ShippingMethodKey): string {
  if (key === "home_delivery") {
    return "Home delivery";
  }

  if (key === "office_delivery") {
    return "Office delivery";
  }

  return key === "custom_1" ? "Custom method 1" : "Custom method 2";
}
