import { useMemo, useState } from "react";

import { parseOptionalPrice } from "@/lib/generator/pricing";
import {
  pendingChangeItems,
  pendingPriceCount,
  withPendingPrice,
} from "@/lib/shipping-zones/pending-changes";
import { reviewContextFromPendingChanges } from "@/lib/shipping-zones/preview-request";
import {
  buildShippingZoneRows,
  isShippingMethodKey,
  livePriceForKey,
  methodKeys,
  rowMatchesFilter,
  rowMatchesSearch,
  shippingZoneStats,
} from "@/lib/shipping-zones/status";
import type { ShippingMethodKey } from "@/types/generator";
import type {
  PendingPriceMap,
  ShippingZoneFilter,
  ShippingZoneRowView,
  ShippingZonesPageProps,
} from "@/types/shipping-zones";

import { PendingChangesBar } from "./PendingChangesBar";
import { ReviewChangesDialog } from "./ReviewChangesDialog";
import { ShippingZonesHeader } from "./ShippingZonesHeader";
import { ShippingZonesStatusCard } from "./ShippingZonesStatusCard";
import { ShippingZonesTable } from "./ShippingZonesTable";
import { ShippingZonesToolbar } from "./ShippingZonesToolbar";

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
  const [bulkPrice, setBulkPrice] = useState("");
  const [pendingPrices, setPendingPrices] = useState<PendingPriceMap>({});
  const [reviewOpen, setReviewOpen] = useState(false);

  const editableMethodKeys = methodKeys(methodDefs);
  const [targetMethod, setTargetMethod] = useState<ShippingMethodKey>(
    editableMethodKeys[0] ?? "home_delivery",
  );

  const rows = useMemo(
    () => buildShippingZoneRows(wilayas, methodDefs, diagnosticsState, pendingPrices),
    [diagnosticsState, methodDefs, pendingPrices, wilayas],
  );
  const visibleRows = rows.filter(
    (row) => rowMatchesFilter(row, filter) && rowMatchesSearch(row, search),
  );
  const selectableVisibleRows = visibleRows.filter((row) => row.canSelect);
  const allSelected =
    selectableVisibleRows.length > 0 &&
    selectableVisibleRows.every((row) => selectedCodes.includes(row.wilaya.code));
  const selectedEditableRows = rows.filter(
    (row) => selectedCodes.includes(row.wilaya.code) && canEditTargetMethod(row, targetMethod),
  );
  const selectedRows = rows.filter((row) => selectedCodes.includes(row.wilaya.code));
  const protectedSelectionCount = selectedRows.length - selectedEditableRows.length;
  const stats = shippingZoneStats(rows);
  const pendingCount = pendingPriceCount(pendingPrices);
  const changes = pendingChangeItems(rows, pendingPrices);
  const reviewContext = reviewContextFromPendingChanges(
    wilayas,
    methodDefs,
    diagnosticsState,
    pendingPrices,
  );
  const hasMissingSetup = rows.some(
    (row) => row.status === "missing" || row.status === "unavailable",
  );

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

  const setBulkPendingPrice = (price: number | null) => {
    setPendingPrices((current) =>
      selectedEditableRows.reduce(
        (next, row) =>
          withPendingPrice(
            next,
            row.wilaya.code,
            targetMethod,
            livePriceForKey(row.liveZone, targetMethod),
            price,
          ),
        current,
      ),
    );
  };

  const applyBulkPrice = () => {
    const price = parseOptionalPrice(bulkPrice);
    if (price === undefined || price === null) {
      return;
    }
    setBulkPendingPrice(price);
    setBulkPrice("");
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

  return (
    <div className="pb-24">
      <ShippingZonesHeader
        hasMissingSetup={hasMissingSetup}
        woocommerceSettingsUrl={woocommerceSettingsUrl}
        onLaunchWizard={onLaunchWizard}
        onOpenDiagnostics={onOpenDiagnostics}
      />
      <ShippingZonesStatusCard stats={stats} onOpenDiagnostics={onOpenDiagnostics} />
      <ShippingZonesToolbar
        rows={rows}
        search={search}
        filter={filter}
        pendingCount={pendingCount}
        selectedCount={selectedCodes.length}
        protectedSelectionCount={protectedSelectionCount}
        targetMethod={targetMethod}
        methodDefs={methodDefs.filter((method) => isShippingMethodKey(method.key)).slice(0, 2)}
        bulkPrice={bulkPrice}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onTargetMethodChange={setTargetMethod}
        onBulkPriceChange={setBulkPrice}
        onBulkSetPrice={applyBulkPrice}
        onBulkMakeFree={() => setBulkPendingPrice(0)}
        onClearSelection={() => setSelectedCodes([])}
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
    </div>
  );
}

function canEditTargetMethod(row: ShippingZoneRowView, method: ShippingMethodKey): boolean {
  if (row.home.key === method) {
    return row.home.canEdit;
  }

  if (row.office.key === method) {
    return row.office.canEdit;
  }

  return false;
}
