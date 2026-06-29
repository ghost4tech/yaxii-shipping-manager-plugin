import { Activity, ChevronDown, RotateCcw, Wrench } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ShippingMethodKey } from "@/types/generator";
import type { ShippingZoneRowView } from "@/types/shipping-zones";

import { ShippingPriceCell } from "./ShippingPriceCell";
import { ShippingZoneDetails } from "./ShippingZoneDetails";
import { StatusBadge } from "./StatusBadge";

const DESKTOP_GRID = "lg:grid-cols-[36px_1.2fr_130px_minmax(280px,2fr)_150px_44px]";

export function ShippingZoneRow({
  row,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onPriceChange,
  onWilayaStatusChange,
  onUndo,
  onUndoStatus,
  onOpenDiagnostics,
  onLaunchWizard,
  onRepairSetup,
}: {
  row: ShippingZoneRowView;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: (selected: boolean) => void;
  onToggleExpand: () => void;
  onPriceChange: (method: ShippingMethodKey, price: number | null | undefined) => void;
  onWilayaStatusChange: (enabled: boolean) => void;
  onUndo: (method: ShippingMethodKey) => void;
  onUndoStatus: (method: ShippingMethodKey) => void;
  onOpenDiagnostics: () => void;
  onLaunchWizard: () => void;
  onRepairSetup: () => void;
}) {
  const hasPending = row.pendingMethodCount > 0;
  const contextualAction = actionForRow(row.status);
  const dimmed = rowHasDisabledManagedMethod(row);

  return (
    <div
      className={cn(
        "border-b border-border last:border-b-0 transition-colors",
        selected && "bg-primary/10",
        hasPending && "bg-primary/5",
        dimmed && "bg-muted/30 text-muted-foreground",
      )}
    >
      <div className={cn("grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-4 py-3", DESKTOP_GRID)}>
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selected}
            disabled={!row.canSelect}
            onCheckedChange={(value) => onToggleSelect(Boolean(value))}
            aria-label={`Select ${row.wilaya.name}`}
          />
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-7 min-w-9 items-center justify-center rounded-md bg-muted px-1.5 font-mono text-xs font-semibold text-foreground/70">
            {row.wilaya.code}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{row.wilaya.name}</div>
            <div className="truncate text-xs text-muted-foreground" dir="rtl">
              {row.wilaya.ar}
            </div>
          </div>
        </div>
        <div className="col-start-2 flex flex-wrap items-center gap-2 lg:col-start-auto">
          <StatusBadge status={row.status} />
          {hasPending && (
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Pending
            </span>
          )}
        </div>
        <div className="col-start-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3 lg:col-start-auto">
          {row.methods.map((method) => (
            <ShippingPriceCell
              key={method.key}
              method={method}
              onChange={(price) => onPriceChange(method.key, price)}
              onUndo={() => onUndo(method.key)}
              onUndoStatus={() => onUndoStatus(method.key)}
            />
          ))}
        </div>
        <div className="col-start-2 flex justify-start lg:col-start-auto lg:justify-end">
          <RowActions
            row={row}
            contextualAction={contextualAction}
            onOpenDiagnostics={onOpenDiagnostics}
            onLaunchWizard={onLaunchWizard}
            onRepairSetup={onRepairSetup}
            onWilayaStatusChange={onWilayaStatusChange}
            onDiscardPending={() => {
              row.methods.forEach((method) => {
                onUndo(method.key);
                onUndoStatus(method.key);
              });
            }}
          />
        </div>
        <div className="col-start-2 flex justify-start lg:col-start-auto lg:justify-end">
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Toggle ${row.wilaya.name} details`}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>
      {expanded && <ShippingZoneDetails row={row} />}
    </div>
  );
}

function RowActions({
  row,
  contextualAction,
  onOpenDiagnostics,
  onLaunchWizard,
  onRepairSetup,
  onWilayaStatusChange,
  onDiscardPending,
}: {
  row: ShippingZoneRowView;
  contextualAction: "generator" | "diagnostics" | null;
  onOpenDiagnostics: () => void;
  onLaunchWizard: () => void;
  onRepairSetup: () => void;
  onWilayaStatusChange: (enabled: boolean) => void;
  onDiscardPending: () => void;
}) {
  const knownDisplayStates = row.methods
    .map((method) => method.pendingEnabled ?? method.enabled)
    .filter((enabled): enabled is boolean => typeof enabled === "boolean");
  const enabled = knownDisplayStates.length > 0 && knownDisplayStates.some(Boolean);
  const canToggle = row.methods.some((method) => method.canToggleStatus);

  return (
    <div className="flex items-center justify-end gap-1.5">
      {row.canRepair && (
        <button
          type="button"
          onClick={onRepairSetup}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 text-xs font-medium text-primary hover:border-primary/40 hover:bg-primary/15"
        >
          <Wrench className="h-3.5 w-3.5" />
          Repair setup
        </button>
      )}
      <Switch
        checked={enabled}
        disabled={!canToggle}
        onCheckedChange={(value) => onWilayaStatusChange(Boolean(value))}
        aria-label={`${row.wilaya.name} enable status`}
        title={canToggle ? "Enable or disable managed methods for this wilaya" : undefined}
        className={cn(!enabled && "data-[state=unchecked]:bg-muted")}
      />
      {row.pendingMethodCount > 0 && (
        <button
          type="button"
          onClick={onDiscardPending}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Discard ${row.wilaya.name} pending changes`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
      {contextualAction === "generator" && !row.canRepair && (
        <button
          type="button"
          onClick={onLaunchWizard}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Wrench className="h-3.5 w-3.5" />
          Open Generator
        </button>
      )}
      {contextualAction === "diagnostics" && (
        <button
          type="button"
          onClick={onOpenDiagnostics}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Activity className="h-3.5 w-3.5" />
          Check diagnostics
        </button>
      )}
    </div>
  );
}

export function ShippingZoneTableHeader({
  allSelected,
  onSelectAll,
}: {
  allSelected: boolean;
  onSelectAll: (selected: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "hidden items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid",
        DESKTOP_GRID,
      )}
    >
      <div className="flex items-center justify-center">
        <Checkbox checked={allSelected} onCheckedChange={(value) => onSelectAll(Boolean(value))} />
      </div>
      <div>Wilaya</div>
      <div>Status</div>
      <div>Methods</div>
      <div className="text-right">Active</div>
      <div />
    </div>
  );
}

function actionForRow(status: ShippingZoneRowView["status"]): "generator" | "diagnostics" | null {
  if (status === "missing" || status === "unavailable") {
    return "generator";
  }

  if (status === "protected" || status === "conflict" || status === "not_managed") {
    return "diagnostics";
  }

  return null;
}

function rowHasDisabledManagedMethod(row: ShippingZoneRowView): boolean {
  return row.methods.some((method) => method.enabled === false);
}
