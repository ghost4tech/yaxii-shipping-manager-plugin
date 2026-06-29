import { useMemo, useState } from "react";

import {
  pendingChangeItems,
  pendingPriceCount,
  withPendingPrice,
} from "@/lib/shipping-zones/pending-changes";
import {
  repairContextFromRows,
  reviewContextFromPendingChanges,
} from "@/lib/shipping-zones/preview-request";
import {
  buildShippingZoneRows,
  livePriceForKey,
  methodKeys,
  rowMatchesFilter,
  rowMatchesSearch,
  shippingZoneStats,
} from "@/lib/shipping-zones/status";
import type { ShippingMethodKey } from "@/types/generator";
import type {
  PendingPriceMap,
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

type BulkTarget = "home" | "office" | "both";

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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [repairRows, setRepairRows] = useState<ShippingZoneRowView[]>([]);

  const editableMethodKeys = methodKeys(methodDefs);

  const rows = useMemo(
    () => buildShippingZoneRows(wilayas, methodDefs, diagnosticsState, pendingPrices),
    [diagnosticsState, methodDefs, pendingPrices, wilayas],
  );
  const bulkMethodKeys = bulkTargetMethodKeys(rows, editableMethodKeys);
  const visibleRows = rows.filter(
    (row) => rowMatchesFilter(row, filter) && rowMatchesSearch(row, search),
  );
  const selectableVisibleRows = visibleRows.filter((row) => row.canSelect);
  const allSelected =
    selectableVisibleRows.length > 0 &&
    selectableVisibleRows.every((row) => selectedCodes.includes(row.wilaya.code));
  const selectedRows = rows.filter((row) => selectedCodes.includes(row.wilaya.code));
  const selectedRowsWithEditableMethods = selectedRows.filter((row) =>
    methodViewsForBulkTarget(row, "both").some((method) => method.canEdit),
  );
  const selectedRepairableRows = selectedRows.filter((row) => row.canRepair);
  const protectedSelectionCount =
    selectedRows.length - selectedRowsWithEditableMethods.length - selectedRepairableRows.length;
  const stats = shippingZoneStats(rows);
  const pendingCount = pendingPriceCount(pendingPrices);
  const changes = pendingChangeItems(rows, pendingPrices);
  const reviewContext = reviewContextFromPendingChanges(
    wilayas,
    methodDefs,
    diagnosticsState,
    pendingPrices,
  );
  const repairContext = repairContextFromRows(repairRows, methodDefs);

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
    setReviewOpen(false);
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

  return (
    <div className="pb-24">
      <ShippingZonesHeader />
      <ShippingZonesStatusCard
        stats={stats}
        woocommerceSettingsUrl={woocommerceSettingsUrl}
        onOpenDiagnostics={onOpenDiagnostics}
      />
      <ShippingZonesToolbar
        rows={rows}
        search={search}
        filter={filter}
        pendingCount={pendingCount}
        selectedCount={selectedCodes.length}
        editableSelectionCount={selectedRowsWithEditableMethods.length}
        repairableSelectionCount={selectedRepairableRows.length}
        protectedSelectionCount={protectedSelectionCount}
        targetMethodKeys={bulkMethodKeys}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onRunQuickTool={runQuickTool}
        onClearSelection={() => setSelectedCodes([])}
        onReviewChanges={() => setReviewOpen(true)}
        onRepairSelected={() => openRepairDialog(selectedRepairableRows)}
      />
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
        onUndo={(row, method) => updatePendingPrice(row, method, undefined)}
        onOpenDiagnostics={onOpenDiagnostics}
        onLaunchWizard={onLaunchWizard}
        onRepairSetup={(row) => openRepairDialog([row])}
        onClearSearch={() => {
          setSearch("");
          setFilter("all");
        }}
      />
      {pendingCount === 0 && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No pending changes. Edit a managed price to start.
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
        onApplied={() => setPendingPrices({})}
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

function methodViewsForBulkTarget(
  row: ShippingZoneRowView,
  target: BulkTarget,
): ShippingZoneMethodView[] {
  if (target === "both") {
    return [row.home, row.office];
  }

  return target === "home" ? [row.home] : [row.office];
}

function bulkTargetMethodKeys(
  rows: ShippingZoneRowView[],
  fallbackKeys: ShippingMethodKey[],
): ShippingMethodKey[] {
  const firstRow = rows[0];
  const keys = [firstRow?.home.key, firstRow?.office.key].filter((key): key is ShippingMethodKey =>
    Boolean(key),
  );

  return keys.length > 0 ? keys : fallbackKeys.slice(0, 2);
}

function copySelectedMethodPrice(
  row: ShippingZoneRowView,
  from: ShippingMethodKey,
  to: ShippingMethodKey,
  pendingPrices: PendingPriceMap,
): PendingPriceMap {
  const targetMethod = row.home.key === to ? row.home : row.office.key === to ? row.office : null;
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
  const methodView =
    row.home.key === method ? row.home : row.office.key === method ? row.office : null;
  if (!methodView) {
    return undefined;
  }

  return methodView.pendingPrice !== undefined ? methodView.pendingPrice : methodView.livePrice;
}
