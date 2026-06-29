import { ChevronDown } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShippingMethodKey } from "@/types/generator";
import type { ShippingZoneRowView } from "@/types/shipping-zones";

import { ShippingPriceCell } from "./ShippingPriceCell";
import { ShippingZoneDetails } from "./ShippingZoneDetails";
import { StatusBadge } from "./StatusBadge";

const DESKTOP_GRID = "lg:grid-cols-[36px_1.25fr_150px_1.35fr_1.35fr_132px_44px]";

export function ShippingZoneRow({
  row,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onPriceChange,
  onUndo,
  onOpenDiagnostics,
  onLaunchWizard,
}: {
  row: ShippingZoneRowView;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: (selected: boolean) => void;
  onToggleExpand: () => void;
  onPriceChange: (method: ShippingMethodKey, price: number | null | undefined) => void;
  onUndo: (method: ShippingMethodKey) => void;
  onOpenDiagnostics: () => void;
  onLaunchWizard: () => void;
}) {
  const hasPending = row.pendingMethodCount > 0;
  const contextualAction = actionForRow(row.status);

  return (
    <div
      className={cn(
        "border-b border-border last:border-b-0 transition-colors",
        selected && "bg-primary/5",
        hasPending && "bg-primary/5",
      )}
    >
      <div className={cn("grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-4 py-3", DESKTOP_GRID)}>
        <div>
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
        <div className="col-start-2 lg:col-start-auto">
          <ShippingPriceCell
            method={row.home}
            onChange={(price) => onPriceChange(row.home.key, price)}
            onUndo={() => onUndo(row.home.key)}
          />
        </div>
        <div className="col-start-2 lg:col-start-auto">
          <ShippingPriceCell
            method={row.office}
            onChange={(price) => onPriceChange(row.office.key, price)}
            onUndo={() => onUndo(row.office.key)}
          />
        </div>
        <div className="col-start-2 flex justify-start lg:col-start-auto lg:justify-end">
          {contextualAction === "generator" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={onLaunchWizard}
            >
              Open Generator
            </Button>
          )}
          {contextualAction === "diagnostics" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={onOpenDiagnostics}
            >
              Check diagnostics
            </Button>
          )}
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
      <div>
        <Checkbox checked={allSelected} onCheckedChange={(value) => onSelectAll(Boolean(value))} />
      </div>
      <div>Wilaya</div>
      <div>Status</div>
      <div>Home delivery</div>
      <div>Office / Stopdesk</div>
      <div className="text-right">Actions</div>
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
