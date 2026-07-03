import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ShippingMethodKey } from "@/types/generator";
import type { ShippingZoneRowView } from "@/types/shipping-zones";

import { ShippingZoneRow, ShippingZoneTableHeader } from "./ShippingZoneRow";

export function ShippingZonesTable({
  rows,
  selectedCodes,
  expandedRows,
  allSelected,
  onSelectAll,
  onToggleSelect,
  onToggleExpand,
  onPriceChange,
  onWilayaStatusChange,
  onUndo,
  onUndoStatus,
  onOpenDiagnostics,
  onOpenWooCommerceZones,
  onLaunchWizard,
  onReviewRowChanges,
  onRepairSetup,
  onClearSearch,
}: {
  rows: ShippingZoneRowView[];
  selectedCodes: string[];
  expandedRows: Record<string, boolean>;
  allSelected: boolean;
  onSelectAll: (selected: boolean) => void;
  onToggleSelect: (wilayaCode: string, selected: boolean) => void;
  onToggleExpand: (wilayaCode: string) => void;
  onPriceChange: (
    row: ShippingZoneRowView,
    method: ShippingMethodKey,
    price: number | null | undefined,
  ) => void;
  onWilayaStatusChange: (row: ShippingZoneRowView, enabled: boolean) => void;
  onUndo: (row: ShippingZoneRowView, method: ShippingMethodKey) => void;
  onUndoStatus: (row: ShippingZoneRowView, method: ShippingMethodKey) => void;
  onOpenDiagnostics: () => void;
  onOpenWooCommerceZones: () => void;
  onLaunchWizard: () => void;
  onReviewRowChanges: (row: ShippingZoneRowView) => void;
  onRepairSetup: (row: ShippingZoneRowView) => void;
  onClearSearch: () => void;
}) {
  const headerMethods = rows[0]?.methods.map((method) => ({
    key: method.key,
    label: method.label,
  }));

  return (
    <div className="mt-4 overflow-hidden rounded-md border border-border bg-card">
      <ShippingZoneTableHeader
        allSelected={allSelected}
        methodLabels={headerMethods ?? []}
        onSelectAll={onSelectAll}
      />
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-medium">No wilayas match your search</h3>
          <p className="max-w-xs text-xs text-muted-foreground">
            Try a different name, code, or clear the filters.
          </p>
          <Button size="sm" variant="outline" className="mt-2 h-8" onClick={onClearSearch}>
            Clear search
          </Button>
        </div>
      ) : (
        rows.map((row) => (
          <ShippingZoneRow
            key={row.wilaya.code}
            row={row}
            selected={selectedCodes.includes(row.wilaya.code)}
            expanded={Boolean(expandedRows[row.wilaya.code])}
            onToggleSelect={(selected) => onToggleSelect(row.wilaya.code, selected)}
            onToggleExpand={() => onToggleExpand(row.wilaya.code)}
            onPriceChange={(method, price) => onPriceChange(row, method, price)}
            onWilayaStatusChange={(enabled) => onWilayaStatusChange(row, enabled)}
            onUndo={(method) => onUndo(row, method)}
            onUndoStatus={(method) => onUndoStatus(row, method)}
            onOpenDiagnostics={onOpenDiagnostics}
            onOpenWooCommerceZones={onOpenWooCommerceZones}
            onLaunchWizard={onLaunchWizard}
            onReviewRowChanges={() => onReviewRowChanges(row)}
            onRepairSetup={() => onRepairSetup(row)}
          />
        ))
      )}
    </div>
  );
}
